const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
const {getUserId} = require('../utils');

const {items} = require('./items');

const Query = {
	me: (root, args, ctx) => ctx.db.user({id: getUserId(ctx)}),
	customer: (root, {id}, ctx) => ctx.db
		.user({id: getUserId(ctx)})
		.company()
		.customer({id}),
	project: async (root, {id, token}, ctx) => {
		// public access with a secret token inserted in a mail
		if (token) {
			const [project] = await ctx.db.projects({where: {id, token}});

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

		const [project] = await ctx.db.projects({
			where: {
				id,
				customer: {
					serviceCompany: {
						owner: {id: getUserId(ctx)},
					},
				},
			},
		});

		if (!project) {
			throw new NotFoundError(`Project '${id}' has not been found`);
		}

		return project;
	},
	quote: async (root, {id, token}, ctx) => {
		// public access with a secret token inserted in a mail
		if (token) {
			const [quote] = await ctx.db.quotes({where: {id, token}});

			if (!quote) {
				throw new NotFoundError(`Quote '${id}' has not been found`);
			}

			sendMetric({metric: 'inyo.quote.viewed.total'});

			if (!quote.viewedByCustomer) {
				await ctx.db.updateQuote({
					where: {id},
					data: {viewedByCustomer: true},
				});

				quote.viewedByCustomer = true;

				sendMetric({metric: 'inyo.quote.viewed.unique'});
			}

			return quote;
		}

		const [quote] = await ctx.db.quotes({
			where: {
				id,
				customer: {
					serviceCompany: {
						owner: {id: getUserId(ctx)},
					},
				},
			},
		});

		if (!quote) {
			throw new NotFoundError(`Quote '${id}' has not been found`);
		}

		return quote;
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
									option: {
										quote: {token},
									},
								},
							},
							{
								section: {
									project: {token},
								},
							},
						],
					},
				},
			});

			const quoteCustomer = await ctx.db.quote({token}).customer();
			const projectCustomer = await ctx.db.project({token}).customer();

			const customer = projectCustomer || quoteCustomer;

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
					id: itemId,
					section: {
						OR: [
							{
								option: {
									quote: {
										customer: {
											serviceCompany: {
												owner: {id: userId},
											},
										},
									},
								},
							},
							{
								project: {
									customer: {
										serviceCompany: {
											owner: {id: userId},
										},
									},
								},
							},
						],
					},
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
			item: {
				section: {
					project: {
						customer: {
							serviceCompany: {
								owner: {id: getUserId(ctx)},
							},
						},
					},
				},
			},
		},
	}),
	items,
};

module.exports = {
	Query,
};
