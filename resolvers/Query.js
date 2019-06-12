const {getUserId, createItemOwnerFilter} = require('../utils');

const {items} = require('./items');
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
	customer: (root, {id}, ctx) => ctx.db
		.user({id: getUserId(ctx)})
		.company()
		.customer({id}),
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
	item: (root, {id}, ctx) => ctx.db.item({id}),
	itemComments: async (root, {itemId, token}, ctx) => {
		if (token) {
			const comments = await ctx.db.comments({
				where: {
					item: {
						id: itemId,
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

			return comments;
		}

		const userId = getUserId(ctx);

		const comments = await ctx.db.comments({
			where: {
				item: {
					AND: [{id: itemId}, createItemOwnerFilter(userId)],
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

		return comments;
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
	items,
	tasks,
};

module.exports = {
	Query,
};
