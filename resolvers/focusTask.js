const moment = require('moment');
const {
	getUserId,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
	isCustomerTask,
	reorderList,
} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {
	setupItemReminderEmail,
	sendItemContentAcquisitionEmail,
} = require('../emails/TaskEmail');

const gql = String.raw;

const FocusingItemWithProject = gql`
	fragment FocusingItemWithProject on Item {
		id
		type
		status
		name
		description
		scheduledFor
		schedulePosition
		scheduledForDays {
			id
			date
			position
			status
		}
		attachments {
			url
			filename
		}
		linkedCustomer {
			id
			title
			firstName
			lastName
			email
			phone
			token
		}
		section {
			project {
				id
				token
				name
				customer {
					id
					title
					firstName
					lastName
					email
					phone
					token
				}
			}
		}
		focusedBy {
			id
		}
		pendingReminders: reminders(where: {status: PENDING, sendingDate_gt: "${new Date().toJSON()}"}) {
			type
		}
	}
`;

const focusTask = async (
	parent,
	{
		id, reminders, from, for: scheduledFor, schedulePosition, action = 'MOVE',
	},
	ctx,
) => {
	let scheduledForDate = moment(scheduledFor || null).isValid()
		? moment(scheduledFor)
		: moment();
	let fromDate = moment(from || null).isValid() ? moment(from) : null;

	scheduledForDate = scheduledForDate.format(moment.HTML5_FMT.DATE);
	fromDate = fromDate && fromDate.format(moment.HTML5_FMT.DATE);

	const userId = getUserId(ctx);
	// This is so that assignee can schedule their task and only them
	const [item] = await ctx.db
		.items({
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
		})
		.$fragment(FocusingItemWithProject);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (action !== 'MOVE' && isCustomerTask(item)) {
		throw new Error('Only moving a customer task is possible');
	}

	if (
		!item.scheduledForDays.length
		&& !item.focusedBy
		&& isCustomerTask(item)
	) {
		const customer
			= item.linkedCustomer || (item.section && item.section.project.customer);

		if (!customer) {
			throw new InsufficientDataError(
				`Item '${id}' or its project needs a customer to be activated.`,
			);
		}

		const user = await ctx.db.user({id: userId}).$fragment(gql`
			fragment UserAndSettings on User {
				id
				email
				startWorkAt
				firstName
				lastName
				settings {
					assistantName
				}
			}
		`);

		let issueDate = moment(
			`${scheduledForDate}T${user.startWorkAt.split('T')[1]}`,
		);

		if (issueDate.isBefore(moment())) {
			issueDate = moment();
		}

		if (
			['CUSTOMER', 'INVOICE', 'CONTENT_ACQUISITION'].includes(item.type)
			&& item.pendingReminders.length === 0
		) {
			await setupItemReminderEmail(
				{
					userId,
					customerId: customer.id,
					itemId: item.id,
					projectId: item.section && item.section.project.id,
					reminders,
					issueDate: issueDate.toDate(),
				},
				ctx,
			);
			console.log(`Item '${item.id}': Reminders set.`);
		}
	}

	let position = schedulePosition;

	const existingLinkForWantedDay = item.scheduledForDays.find(
		l => l.date.split('T')[0] === scheduledForDate,
	);
	let currentScheduleLink
		= action === 'MOVE' && fromDate
			? item.scheduledForDays.find(l => l.date.split('T')[0] === fromDate)
			: null;

	if (action === 'MOVE' && !fromDate) {
		if (!currentScheduleLink) {
			[currentScheduleLink] = item.scheduledForDays;
		}

		// TODO: which one to move? merge all?
	}

	// we want to put a task on a day it is already scheduled, then just moving
	if (action === 'SPLIT' && existingLinkForWantedDay) {
		action = 'MOVE'; // eslint-disable-line no-param-reassign
		currentScheduleLink = existingLinkForWantedDay;
	}

	let isFinished
		= item.scheduledForDays.length > 0
			? item.scheduledForDays.every(d => d.status === 'FINISHED')
			: item.status === 'FINISHED';

	if (
		!currentScheduleLink
		|| position !== currentScheduleLink.position
		|| (scheduledForDate
			&& scheduledForDate !== currentScheduleLink.date.split('T')[0])
	) {
		const previousScheduledFor = currentScheduleLink
			? currentScheduleLink.date
			: null;

		const dayTasks = await ctx.db.items({
			where: {
				owner: {id: ctx.userId},
				scheduledForDays_some: {
					date: scheduledForDate,
				},
			},
		}).$fragment(gql`
			fragment ItemListWithScheduleDay on Item {
				id
				scheduledForDays(where: {date: "${scheduledForDate}"}) {
					id
					date
					position
				}
			}
		`);
		// needed because we can't order by nested properties
		dayTasks.sort(
			(a, b) => a.scheduledForDays[0].position - b.scheduledForDays[0].position,
		);

		let initialPosition = dayTasks.findIndex(task => task.id === id);

		// not the same list and action is not split
		if (
			action === 'MOVE'
			&& currentScheduleLink
			&& existingLinkForWantedDay !== currentScheduleLink
		) {
			const previousList = await ctx.db.items({
				where: {
					owner: {id: ctx.userId},
					scheduledForDays_some: {
						date: previousScheduledFor,
					},
				},
			}).$fragment(gql`
				fragment ItemListWithScheduleDay2 on Item {
					id
					scheduledForDays(where: {date: "${previousScheduledFor}"}) {
						id
						date
						position
					}
				}
			`);
			// needed because we can't order by nested properties
			dayTasks.sort(
				(a, b) => a.scheduledForDays[0].position - b.scheduledForDays[0].position,
			);

			const previousListPosition = previousList.findIndex(
				task => task.id === id,
			);

			// using an upsert here to update previous tasks not defined with the new system
			await reorderList(
				previousList,
				previousListPosition,
				previousList.length,
				(task, pos) => ctx.db.upsertScheduleSpot({
					where: {
						id:
								task.scheduledForDays.length > 0
									? task.scheduledForDays[0].id
									: undefined,
					},
					update: {
						position: pos,
					},
					create: {
						date: scheduledForDate,
						position: pos,
						task: {connect: {id: item.id}},
					},
				}),
			);

			// we need to remove the previous link if there is a need to merge
			if (existingLinkForWantedDay) {
				await ctx.db.deleteScheduleSpot({id: currentScheduleLink.id});

				isFinished = item.scheduledForDays
					.filter(d => d.id !== currentScheduleLink.id)
					.every(d => d.status === 'FINISHED');

				currentScheduleLink = existingLinkForWantedDay;
			}
		}

		if (typeof position !== 'number' || position >= dayTasks.length) {
			position = initialPosition >= 0 ? dayTasks.length - 1 : dayTasks.length;
		}
		else if (position < 0) {
			position = 0;
		}

		if (initialPosition < 0) {
			initialPosition = dayTasks.length;
		}

		// using an upsert here to update previous tasks not defined with the new system
		await reorderList(dayTasks, initialPosition, position, (task, pos) => ctx.db.upsertScheduleSpot({
			where: {
				id: task.scheduledForDays[0] ? task.scheduledForDays[0].id : '',
			},
			update: {
				position: pos,
			},
			create: {
				date: scheduledForDate,
				position: pos,
				task: {connect: {id: item.id}},
			},
		}));
	}

	// new splits are pending, so the task goes back to pending
	if (action === 'SPLIT' && isFinished && item.scheduledForDays.length > 0) {
		isFinished = false;
	}

	const focusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			status: isFinished ? 'FINISHED' : 'PENDING',
			scheduledFor: scheduledForDate,
			schedulePosition: position,
			scheduledForDays: {
				update: currentScheduleLink
					? {
						where: {id: currentScheduleLink.id},
						data: {date: scheduledForDate, position},
					  }
					: undefined,
				create: currentScheduleLink
					? undefined
					: {
						date: scheduledForDate,
						position,
						status:
								item.status === 'FINISHED' && item.scheduledForDays.length === 0
									? 'FINISHED'
									: 'PENDING',
					  },
			},
			focusedBy: {
				connect: {id: userId},
			},
		},
	});

	await ctx.db.createUserEvent({
		type: 'FOCUSED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: focusedTask.id,
		},
		task: {connect: {id: focusedTask.id}},
		project: item.section && {connect: {id: item.section.project.id}},
	});

	return focusedTask;
};

module.exports = {
	focusTask,
};
