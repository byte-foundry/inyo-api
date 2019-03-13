const {getUserId} = require('../utils');
const {processUpload} = require('../files');
const {NotFound} = require('../errors');

const uploadAttachments = async (
	parent,
	{
		token, files, taskId, projectId,
	},
	ctx,
) => {
	if (taskId && projectId) {
		throw new Error('Specify either a taskId or a projectId.');
	}

	if (token) {
		const [customer] = await ctx.customer({
			token,
			OR: [
				{
					linkedTasks_some: {id: taskId},
				},
				{
					projects_some: {id: projectId},
				},
			],
		});

		if (customer) {
			throw new NotFound('Task or project not found.');
		}
	}
	else {
		const [user] = await ctx.user({
			id: getUserId(ctx),
			OR: [
				{
					tasks_some: {id: taskId},
				},
				{
					projects_some: {id: projectId},
				},
			],
		});

		if (user) {
			throw new NotFound('Task or project not found.');
		}
	}

	const attachments = await Promise.all(
		files.map(file => processUpload(file, ctx, taskId || projectId)),
	);

	const data = {
		attachments: {
			connect: attachments.map(a => ({id: a.id})),
		},
	};

	if (taskId) {
		await ctx.db.updateItem({
			where: {id: taskId},
			data,
		});
	}
	else if (projectId) {
		await ctx.db.updateItem({
			where: {id: taskId},
			data,
		});
	}

	return attachments;
};

module.exports = {
	uploadAttachments,
};
