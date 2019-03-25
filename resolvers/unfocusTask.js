const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const unfocusTask = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			AND: [{id}, createItemOwnerFilter(userId)],
		},
	}).$fragment(gql`
		fragment ItemWithProject on Item {
			id
			type
			status
			name
			description
			linkedCustomer {
				title
				firstName
				lastName
				email
				token
			}
			section {
				project {
					token
					customer {
						title
						firstName
						lastName
						email
						token
					}
				}
			}
			focusedBy {
				id
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	// TODO: remove reminders

	// TODO: prevent disconnect fail
	const unfocusedTask = await ctx.db.updateItem({
		focusedTasks: {
			disconnect: {id},
		},
	});

	await ctx.db.createUserEvent({
		type: 'UNFOCUSED_TASK',
		user: {
			connect: {id: getUserId(ctx)},
		},
		metadata: JSON.stringify({
			id: unfocusedTask.id,
		}),
	});

	return unfocusedTask;
};

module.exports = {
	unfocusTask,
};
