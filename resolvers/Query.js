const {getUserId, createItemOwnerFilter} = require('../utils');

const {tasks} = require('./tasks');

const Query = {
	me: async (root, args, ctx) => {
		await ctx.db.createUserEvent({
			type: 'ME_CALL',
			user: {
				connect: {id: getUserId(ctx)},
			},
		});
		return ctx.db.user({id: getUserId(ctx)});
	},
	customer: (root, {id, token}, ctx) => ctx.db.customer({id, token}),
	project: async (root, {id, token}, ctx) => {
		const project = await ctx.db.project({id});

		if (token && token !== process.ADMIN_TOKEN) {
			if (!project.viewedByCustomer) {
				await ctx.db.updateProject({
					where: {id},
					data: {viewedByCustomer: true},
				});

				project.viewedByCustomer = true;
			}

			const hasCustomer = await ctx.db.$exists.customer({token});

			if (hasCustomer) {
				await ctx.db.createCustomerEvent({
					type: 'VIEWED_PROJECT',
					customer: {
						connect: {token},
					},
					metadata: {
						projectId: project.id,
					},
				});
			}
		}

		return project;
	},
	quote: () => {
		throw new Error('Quotes are not supported anymore');
	},
	item: async (root, {id, token, updateCommentViews}, ctx) => {
		if (updateCommentViews) {
			if (token) {
				const comments = await ctx.db.comments({
					where: {
						item: {
							id,
							OR: [
								{
									section: {
										project: {
											OR: [
												{
													token,
												},
												{
													customer: {token},
												},
											],
										},
									},
								},
								{
									linkedCustomer: {token},
								},
							],
						},
					},
				});

				const [customer] = await ctx.db.customers({
					where: {
						OR: [
							{
								projects_some: {
									token,
								},
							},
							{
								token,
							},
						],
					},
				});

				await Promise.all(
					comments.map(comment => ctx.db.updateComment({
						where: {id: comment.id},
						data: {
							views: {
								create: {
									customer: {connect: {id: customer.id}},
								},
							},
						},
					})),
				);
			}
			else {
				const userId = getUserId(ctx);

				const comments = await ctx.db.comments({
					where: {
						item: {
							AND: [{id}, createItemOwnerFilter(userId)],
						},
					},
				});

				await Promise.all(
					comments.map(comment => ctx.db.updateComment({
						where: {id: comment.id},
						data: {
							views: {
								create: {
									user: {connect: {id: userId}},
								},
							},
						},
					})),
				);
			}
		}

		return ctx.db.item({id});
	},
	reminders: async (root, args, ctx) => ctx.db.reminders({
		where: {
			type_in: [
				'DELAY',
				'FIRST',
				'SECOND',
				'LAST',
				'INVOICE_DELAY',
				'INVOICE_FIRST',
				'INVOICE_SECOND',
				'INVOICE_THIRD',
				'INVOICE_FOURTH',
				'INVOICE_LAST',
			],
			item: createItemOwnerFilter(getUserId(ctx)),
			sendingDate_gt: new Date(),
		},
	}),
	items() {
		throw new Error(
			'items is not supported anymore, use tasks or me.tasks instead.',
		);
	},
	tasks,
};

module.exports = {
	Query,
};
