const moment = require('moment');

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

const unfocusTask = async (parent, {id, from}, ctx) => {
	const fromDate = moment(from || null).isValid()
		? moment(from).format(moment.HTML5_FORMAT.DATE)
		: null;

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
			scheduledForDays(orderBy: date_ASC) {
				id
				date
				position
			}
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
	if (
		!item.focusedBy
		&& !item.scheduledFor
		&& !item.schedulePosition
		&& (item.scheduledForDays.length === 0
			|| (fromDate
				&& !item.scheduledForDays.every(d => d.date.split('T')[0] !== fromDate)))
	) {
		return ctx.db.item({id});
	}

	const scheduledFor = item.scheduledForDays.find(
		d => d.date.split('T')[0] === fromDate,
	);
	if (scheduledFor) {
		// resetting dashboard list
		const daySpots = await ctx.db.scheduleSpots({
			where: {
				date: new Date(fromDate),
				position_gt: scheduledFor.position,
			},
			orderBy: 'position_ASC',
		});

		daySpots.forEach((day, index) => ctx.db.updateScheduleSpot({
			where: {id: day.id},
			data: {position: day.position + index},
		}));

		await ctx.db.deleteScheduleSpot({id: scheduledFor.id});
	}

	// TODO: remove everything if from not specified

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
