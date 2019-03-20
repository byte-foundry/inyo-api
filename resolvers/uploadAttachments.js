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

	let ownerId;

	if (token) {
		const [customer] = await ctx.db.customers({
			where: {
				token,
				OR: taskId
					? [
						{
							linkedTasks_some: {id: taskId},
						},
						{
							projects_some: {
								sections_some: {
									items_some: {id: taskId},
								},
							},
						},
					  ]
					: [
						{
							projects_some: {id: projectId},
						},
					  ],
			},
		});

		if (!customer) {
			throw new NotFoundError('Task or project not found.');
		}

		ownerId = customer.id;
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

		ownerId = user.id;
	}

	const attachments = await Promise.all(
		files.map(file => processUpload(file, ctx, taskId || projectId)),
	);

	await Promise.all(
		attachments.map(a => ctx.db.updateFile({
			where: {id: a.id},
			data: {
				linkedTask: taskId && {connect: {id: taskId}},
				linkedProject: projectId && {connect: {id: projectId}},
				ownerUser: !token && {connect: {id: ownerId}},
				ownerCustomer: token && {connect: {id: ownerId}},
			},
		})),
	);

	return attachments;
};

module.exports = {
	uploadAttachments,
};
