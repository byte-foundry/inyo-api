const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');

const unfinishItem = async (parent, {id, token}, ctx) => {
	const fragment = gql`
		fragment ItemWithQuoteAndProject on Item {
			name
			status
			reviewer
			canceledReminders: reminders(where: {status: CANCELED}) {
				id
				postHookId
				type
				status
			}
			section {
				id
				option {
					sections {
						name
						items {
							status
						}
					}
					quote {
						id
					}
				}
				project {
					id
					token
					name
					status
					sections {
						name
						items {
							status
						}
					}
				}
			}
		}
	`;

	if (token) {
		const [item] = await ctx.db
			.items({
				where: {
					id,
					OR: [
						{section: {option: {quote: {token}}}},
						{section: {project: {token}}},
					],
				},
			})
			.$fragment(fragment);

		if (item.reviewer !== 'CUSTOMER') {
			throw new Error('This item cannot be resetted by the customer.');
		}

		const {project} = item.section;

		if (project.status === 'FINISHED' || item.status !== 'FINISHED') {
			throw new Error(`Item '${id}' cannot be resetted.`);
		}

		sendMetric({metric: 'inyo.item.unvalidated'});

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'PENDING',
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				id,
				OR: [
					{
						section: {
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
					},
					{
						section: {
							project: {
								customer: {
									serviceCompany: {
										owner: {id: userId},
									},
								},
							},
						},
					},
				],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.section.quote) {
		throw new Error('Unfinishing a quote task is not supported.');
	}

	const {project} = item.section;

	if (item.reviewer !== 'USER') {
		throw new Error('This item cannot be resetted by the user.');
	}

	if (project.status === 'FINISHED' || item.status !== 'FINISHED') {
		throw new Error(`Item '${id}' cannot be resetted.`);
	}

	sendMetric({metric: 'inyo.item.unvalidated'});

	return ctx.db.updateItem({
		where: {id},
		data: {
			status: 'PENDING',
		},
	});
};

module.exports = {
	unfinishItem,
};
