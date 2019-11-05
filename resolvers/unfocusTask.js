const {
	getUserId,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');
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
	// This is so that assignee can schedule their task and only them
	const [item] = await ctx.db.items({
		where: {
			AND: [
				{id},
				{
					OR: [
						{
							AND: [
								createItemOwnerFilter(userId),
								{
									assignee: null,
								},
							],
						},
						createItemCollaboratorFilter(userId),
					],
				},
			],
		},
	}).$fragment(gql`
		fragment ItemWithProject on Item {
			id
			type
			status
			name
			description
			scheduledFor
			schedulePosition
			linkedCustomer {
				title
				firstName
				lastName
				email
				token
			}
			section {
				project {
					id
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
	if (!item.focusedBy && !item.scheduledFor && !item.schedulePosition) {
		return ctx.db.item({id});
	}

	if (item.scheduledFor && item.schedulePosition) {
		// resetting dashboard list
		const dayTasks = await ctx.db.items({
			where: {
				scheduledFor: item.scheduledFor,
				schedulePosition_gt: item.schedulePosition,
			},
			orderBy: 'schedulePosition_ASC',
		});

		dayTasks.forEach((task, index) => ctx.db.updateItem({
			where: {id: task.id},
			data: {schedulePosition: item.schedulePosition + index},
		}));
	}

	await cancelPendingReminders(item.pendingReminders, id, ctx);

	const unfocusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			scheduledFor: null,
			schedulePosition: null,
			focusedBy: item.focusedBy && {
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
		task: {connect: {id: unfocusedTask.id}},
		project: item.section && {connect: {id: item.section.project.id}},
	});

	return unfocusedTask;
};

module.exports = {
	unfocusTask,
};
