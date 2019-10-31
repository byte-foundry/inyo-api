const moment = require('moment');
const {
	getUserId,
	getAppUrl,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
	isCustomerTask,
	formatName,
	formatFullName,
	filterDescription,
	reorderList,
} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {
	setupItemReminderEmail,
	sendItemContentAcquisitionEmail,
} = require('../emails/TaskEmail');

const gql = String.raw;

const focusTask = async (
	parent,
	{
		id, reminders, for: scheduledFor, schedulePosition,
	},
	ctx,
) => {
	let scheduledForDate = moment(scheduledFor).isValid()
		? moment(scheduledFor)
		: moment();

	scheduledForDate = scheduledForDate.format(moment.HTML5_FMT.DATE);

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
		fragment FocusingItemWithProject on Item {
			id
			type
			status
			name
			description
			scheduledFor
			schedulePosition
			attachments {
				url
				filename
			}
			linkedCustomer {
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
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (!item.scheduledFor && !item.focusedBy && isCustomerTask(item)) {
		const customer
			= item.linkedCustomer || (item.section && item.section.project.customer);

		if (!customer) {
			throw new InsufficientDataError(
				`Item '${id}' or its project needs a customer to be activated.`,
			);
		}

		const user = await ctx.db.user({id: userId}).$fragment(gql`
			fragment userAndSettings on User {
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

		let url = 'Pas de projet ni client 🤷‍';

		if (item.section && item.section.project.customer === customer) {
			const {project} = item.section;

			url = getAppUrl(
				`/${customer.token}/tasks/${item.id}?projectId=${project.id}`,
			);
		}
		else {
			url = getAppUrl(`/${customer.token}/tasks/${item.id}`);
		}

		let issueDate = moment(
			`${scheduledForDate}T${user.startWorkAt.split('T')[1]}`,
		);

		if (issueDate.isBefore(moment())) {
			issueDate = moment();
		}

		const basicInfos = {
			meta: {userId},
			email: customer.email,
			userEmail: user.email,
			user: formatName(user.firstName, user.lastName),
			customerName: String(
				` ${formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				)}`,
			).trimRight(),
			customerEmail: customer.email,
			customerPhone: customer.phone,
			projectName: item.section && item.section.project.name,
			itemName: item.name,
			url,
			issueDate: issueDate.toDate(),
			formattedIssueDate: issueDate.format('DD/MM/YYYY'),
			assistantName: user.settings.assistantName,
		};

		if (item.type === 'CONTENT_ACQUISITION') {
			await sendItemContentAcquisitionEmail(
				{
					...basicInfos,
					name: item.name,
					description: item.description,
					id: item.id,
				},
				ctx,
			);
			console.log('Content acquisition email sent to us');
		}
		else if (item.type === 'CUSTOMER') {
			let userUrl = getAppUrl(`/tasks/${item.id}`);

			if (item.section) {
				const {project} = item.section;

				userUrl = getAppUrl(`/tasks/${item.id}?projectId=${project.id}`);
			}

			if (!item.pendingReminders.length) {
				await setupItemReminderEmail(
					{
						...basicInfos,
						itemId: item.id,
						description: filterDescription(item.description),
						userUrl,
						reminders,
						taskType: item.type,
					},
					ctx,
				);
				console.log(`Item '${item.id}': Reminders set.`);
			}
		}
		else if (item.type === 'INVOICE') {
			const fileUrls = item.attachments;

			let userUrl = getAppUrl(`/tasks/${item.id}`);

			if (item.section) {
				const {project} = item.section;

				userUrl = getAppUrl(`/tasks/${item.id}?projectId=${project.id}`);
			}

			if (!item.pendingReminders.length) {
				await setupItemReminderEmail(
					{
						...basicInfos,
						itemId: item.id,
						description: filterDescription(item.description),
						userUrl,
						reminders,
						fileUrls,
						taskType: item.type,
					},
					ctx,
				);
			}
		}
	}

	let position = schedulePosition;

	if (
		position !== item.schedulePosition
		|| (scheduledFor && scheduledFor !== item.scheduledFor)
	) {
		const dayTasks = await ctx.db.items({
			where: {scheduledFor: scheduledFor || item.scheduledFor},
			orderBy: 'schedulePosition_ASC',
		});

		let initialPosition = dayTasks.findIndex(task => task.id === id);

		// not the same list
		if (initialPosition < 0 && item.scheduledFor) {
			const previousList = await ctx.db.items({
				where: {scheduledFor: item.scheduledFor, NOT: {id: item.id}},
				orderBy: 'schedulePosition_ASC',
			});

			reorderList(
				previousList,
				item.schedulePosition,
				previousList.length,
				(task, pos) => ctx.db.updateItem({
					where: {id: task.id},
					data: {schedulePosition: pos},
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

		await reorderList(dayTasks, initialPosition, position, (task, pos) => ctx.db.updateItem({
			where: {id: task.id},
			data: {schedulePosition: pos},
		}));
	}

	const focusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			scheduledFor: scheduledForDate,
			schedulePosition: position,
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
