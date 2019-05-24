const {getUserId} = require('../utils');
const {processUpload} = require('../files');
const {NotFoundError} = require('../errors');

const gql = String.raw;

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

	let userId;

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
		}).$fragment(gql`
			fragment CustomerWithUser on Customer {
				id
				serviceCompany {
					owner {
						id
					}
				}
			}
		`);

		if (!customer) {
			throw new NotFoundError('Task or project not found.');
		}

		ownerId = customer.id;
		userId = customer.serviceCompany.owner.id;
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
		userId = user.id;
	}

	const attachments = await Promise.all(
		files.map(file => processUpload(file, ctx, taskId || projectId)),
	);

	await Promise.all(
		attachments.map(async (a) => {
			await ctx.db.updateFile({
				where: {id: a.id},
				data: {
					linkedTask: taskId && {connect: {id: taskId}},
					linkedProject: projectId && {connect: {id: projectId}},
					ownerUser: token ? undefined : {connect: {id: ownerId}},
					ownerCustomer: token ? {connect: {id: ownerId}} : undefined,
				},
			});

			if (token) {
				await ctx.db.createCustomerEvent({
					type: 'UPLOADED_ATTACHMENT',
					customer: {
						connect: {id: ownerId},
					},
					metadata: {itemId: taskId},
					notifications: {
						create: {
							user: {connect: {id: userId}},
						},
					},
				});
			}
			else {
				await ctx.db.createUserEvent({
					type: 'UPLOADED_ATTACHMENT',
					user: {
						connect: {id: ownerId},
					},
					metadata: {itemId: taskId},
				});
			}
		}),
	);

	return attachments;
};

module.exports = {
	uploadAttachments,
};
