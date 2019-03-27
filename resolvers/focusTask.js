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

const focusTask = async (parent, {id}, ctx) => {
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
			await sendItemContentAcquisitionEmail({
				...basicInfos,
				name: item.name,
				description: item.description,
				id: item.id,
			});
			console.log('Content acquisition email sent to us');
		}
		// TODO: Are they quite identical?
		else if (item.type === 'CUSTOMER') {
			await setupItemReminderEmail(
				{
					...basicInfos,
					itemId: item.id,
					description: filterDescription(item.description),
					issueDate: new Date(),
				},
				ctx,
			);
			console.log(`Item '${item.id}': Reminders set.`);
		}
		else if (item.type === 'CUSTOMER_REMINDER') {
			// send customer email
			// set reminders
		}
		else if (item.type === 'VALIDATION') {
			// send customer email
			// set reminders
		}
	}

	const focusedTask = await ctx.db.updateItem({
		focusedTasks: {
			connect: {id},
		},
	});

	await ctx.db.createUserEvent({
		type: 'FOCUSED_TASK',
		user: {
			connect: {id: getUserId(ctx)},
		},
		metadata: JSON.stringify({
			id: focusedTask.id,
		}),
	});

	return focusedTask;
};

module.exports = {
	focusTask,
};
