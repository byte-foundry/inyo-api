const {getUserId} = require('../utils');
const {processUpload} = require('../files');
const {NotFoundError} = require('../errors');

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
		const [customer] = await ctx.db.customers({
			token,
			linkedTasks_some: taskId ? {id: taskId} : undefined,
			projects_some: projectId ? {id: projectId} : undefined,
		});

		if (!customer) {
			throw new NotFoundError('Task or project not found.');
		}
	}
	else {
		const [user] = await ctx.db.users({
			where: {
				id: getUserId(ctx),
				tasks_some: taskId ? {id: taskId} : undefined,
				projects_some: projectId ? {id: projectId} : undefined,
			},
		});

		if (!user) {
			throw new NotFoundError('Task or project not found.');
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
