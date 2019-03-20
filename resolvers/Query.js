const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
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
		// public access with a secret token inserted in a mail
		if (token) {
			const [project] = await ctx.db.projects({
				where: {
					id,
					OR: [
						{
							token,
						},
						{
							customer: {token},
						},
					],
				},
			});

			if (!project) {
				throw new NotFoundError(`Project '${id}' has not been found`);
			}

			sendMetric({metric: 'inyo.project.viewed.total'});

			if (!project.viewedByCustomer) {
				await ctx.db.updateProject({
					where: {id},
					data: {viewedByCustomer: true},
				});

				project.viewedByCustomer = true;

				sendMetric({metric: 'inyo.project.viewed.unique'});
			}

			return project;
		}

		const userId = getUserId(ctx);
		const [project] = await ctx.db.projects({
			where: {
				id,
				OR: [
					{
						owner: {id: userId},
					},
					{
						customer: {
							serviceCompany: {
								owner: {id: userId},
							},
						},
					},
				],
			},
		});

		if (!project) {
			throw new NotFoundError(`Project '${id}' has not been found`);
		}

		return project;
	},
	quote: () => {
		throw new Error('Quotes are not supported anymore');
	},
	item: async (root, {id, token}, ctx) => {
		if (token) {
			const [item] = await ctx.db.items({
				where: {
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
			});

			if (!item) {
				throw new NotFoundError(`Item '${id}' has not been found`);
			}

			return item;
		}

		const userId = getUserId(ctx);

		const [item] = await ctx.db.items({
			where: {
				AND: [{id}, createItemOwnerFilter(userId)],
			},
		});

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found`);
		}

		return item;
	},
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
			item: createItemOwnerFilter(getUserId(ctx)),
		},
	}),
	items,
	tasks,
};

module.exports = {
	Query,
};
