const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');
const cancelReminder = require('../reminders/cancelReminder');

const gql = String.raw;

const cancelPendingReminders = async (pendingReminders, itemId, ctx) => {
	try {
		await Promise.all(
			pendingReminders.map(reminder => cancelReminder(reminder.postHookId)),
		);

		const reminderIds = pendingReminders.map(r => r.id);

		await ctx.db.updateManyReminders({
			where: {id_in: reminderIds, status: 'PENDING'},
			data: {status: 'CANCELED'},
		});

		console.log(`Canceled pending reminders of Item '${itemId}'.`, reminderIds);
	}
	catch (err) {
		console.error(
			`Errors cancelling pending reminders of Item '${itemId}'`,
			err,
		);
	}
};

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
			pendingReminders: reminders(where: {status: PENDING}) {
				id
				postHookId
				type
				status
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	// ignoring when already unfocused
	if (!item.focusedBy) {
		return ctx.db.item({id});
	}

	await cancelPendingReminders(item.pendingReminders, id, ctx);

	const unfocusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			focusedBy: {
				disconnect: true,
			},
		},
	});

	await ctx.db.createUserEvent({
		type: 'UNFOCUSED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: unfocusedTask.id,
		},
	});

	return unfocusedTask;
};

module.exports = {
	unfocusTask,
};