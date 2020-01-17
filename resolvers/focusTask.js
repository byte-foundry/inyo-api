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
			date
			position
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
	let scheduledForDate = moment(scheduledFor).isValid()
		? moment(scheduledFor)
		: moment();

	scheduledForDate = scheduledForDate.format(moment.HTML5_FMT.DATE);

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

		if (item.type === 'CONTENT_ACQUISITION') {
			await sendItemContentAcquisitionEmail(
				{
					userId,
					customerId: customer.id,
					itemId: item.id,
					projectId: item.section && item.section.project.id,
					issueDate: issueDate.toDate(),
				},
				ctx,
			);
			console.log('Content acquisition email sent to us');
		}
		else if (item.type === 'CUSTOMER' && item.pendingReminders.length === 0) {
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
		else if (item.type === 'INVOICE' && item.pendingReminders.length === 0) {
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
		}
	}

	const currentScheduleLink = from
		? item.scheduledForDays.find(l => l.date === from)
		: item.scheduledForDays[0];
	let position = schedulePosition;

	if (
		!currentScheduleLink
		|| position !== currentScheduleLink.position
		|| (scheduledFor && scheduledFor !== currentScheduleLink.date)
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
				scheduledForDays(where: {date: ${previousScheduledFor}}) {
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
		if (action === 'MOVE' && initialPosition < 0 && currentScheduleLink) {
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
					scheduledForDays(where: {date: ${previousScheduledFor}}) {
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

			await reorderList(
				previousList,
				currentScheduleLink.position,
				previousList.length,
				(task, pos) => ctx.db.updateScheduleSpot({
					where: {id: task.scheduledForDays[0].id},
					data: {
						scheduledForDays: {
							update: {
								position: pos,
							},
						},
					},
				}),
			);
		}

		if (initialPosition < 0) {
			initialPosition = dayTasks.length;
		}

		if (typeof position !== 'number' || position > dayTasks.length) {
			position = dayTasks.length;
		}
		else if (position < 0) {
			position = 0;
		}

		await reorderList(dayTasks, initialPosition, position, (task, pos) => ctx.db.updateScheduleSpot({
			where: {id: task.scheduledForDays[0].id},
			data: {
				scheduledForDays: {
					update: {
						position: pos,
					},
				},
			},
		}));
	}

	const focusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			scheduledFor: scheduledForDate,
			schedulePosition: position,
			scheduledForDays: {
				upsert: {
					where: {id: currentScheduleLink && currentScheduleLink.id},
					update: {date: scheduledForDate, position},
					create: {date: scheduledForDate, position},
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
