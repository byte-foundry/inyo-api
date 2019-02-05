const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');

const unfinishItem = async (parent, {id, token}, ctx) => {
	const fragment = gql`
		fragment ItemWithProject on Item {
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
				project {
					id
					token
					name
					status
					sections(orderBy: position_ASC) {
						name
						items(orderBy: position_ASC) {
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
					section: {project: {token}},
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
				finishedAt: null,
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				id,
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
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
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
			finishedAt: null,
		},
	});
};

module.exports = {
	unfinishItem,
};
