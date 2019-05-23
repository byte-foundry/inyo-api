const {
	getUserId,
	getAppUrl,
	createItemOwnerFilter,
	isCustomerTask,
	formatName,
	formatFullName,
	filterDescription,
} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {
	setupItemReminderEmail,
	sendItemContentAcquisitionEmail,
} = require('../emails/TaskEmail');

const gql = String.raw;

const focusTask = async (parent, {id, reminders}, ctx) => {
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
			attachments {
				url
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
		else if (item.type ==='INVOICE') {
			const fileUrls = item.attachments.map(a => a.url);

			let userUrl = getAppUrl(`/tasks/${item.id}`);

			if (item.section) {
				const {project} = item.section;

				userUrl = getAppUrl(`/tasks/${item.id}?projectId=${project.id}`);
			}

			if (!item.pendingReminders.length) {
				await setupItemReminderEmail(
					{
						...basicInfos,
						itemId: itemId,
						description: filterDescription(item.description),
						issueDate: new Date(),
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

	const focusedTask = await ctx.db.updateItem({
		where: {id},
		data: {
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
