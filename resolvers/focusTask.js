const moment = require('moment');
const {
	getUserId,
	getAppUrl,
	createItemOwnerFilter,
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
			pendingReminders: reminders(where: {status: PENDING, sendingDate_gt: "${new Date().toJSON()}"}) {
				type
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.status === 'FINISHED') {
		throw new Error(`Item '${id}' is finished, it cannot be focused.`);
	}

	if (!item.focusedBy && isCustomerTask(item)) {
		const customer
			= item.linkedCustomer || (item.section && item.section.project.customer);

		if (!customer) {
			throw new InsufficientDataError(
				`Item '${id}' or its project needs a customer to be activated.`,
			);
		}

		const user = await ctx.db.user({id: userId});

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
		// TODO: Are they quite identical?
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
						issueDate: new Date(),
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
						issueDate: new Date(),
						formattedIssueDate: moment().format('DD/MM/YYYY'),
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
		!(
			schedulePosition === item.schedulePosition
			&& scheduledFor === item.scheduledFor
		)
	) {
		const dayTasks = await ctx.db.items({
			where: {scheduledFor},
			orderBy: 'schedulePosition_ASC',
		});

		let initialPosition = dayTasks.findIndex(task => task.id === id);

		// not the same list
		if (initialPosition < 0 && item.scheduledFor) {
			const previousList = await ctx.db.items({
				where: {scheduledFor: item.scheduledFor},
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

		if (schedulePosition < 0) {
			position = 0;
		}
		else if (schedulePosition > dayTasks.length) {
			position = dayTasks.length;
		}

		await reorderList(dayTasks, initialPosition, position, (task, pos) => ctx.db.updateItem({
			where: {id: task.id},
			data: {schedulePosition: pos},
		}));
	}

	const focusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
			scheduledFor: isCustomerTask(item.type) ? undefined : scheduledFor,
			schedulePosition: isCustomerTask(item.type)
				? undefined
				: schedulePosition,
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
	});

	return focusedTask;
};

module.exports = {
	focusTask,
};
