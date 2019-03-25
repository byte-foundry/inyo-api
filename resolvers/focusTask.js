const {
	getUserId,
	getAppUrl,
	createItemOwnerFilter,
	isCustomerTask,
	formatFullName,
} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {sendItemContentAcquisitionEmail} = require('../emails/TaskEmail');

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

		if (item.type === 'CONTENT_ACQUISITION') {
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

			await sendItemContentAcquisitionEmail({
				userEmail: user.email,
				name: item.name,
				description: item.description,
				customerName: String(
					` ${formatFullName(
						customer.title,
						customer.firstName,
						customer.lastName,
					)}`,
				).trimRight(),
				customerEmail: customer.email,
				url,
				id: item.id,
			});
			console.log('Content acquisition email sent to us');
		}
		// TODO: Are they quite identical?
		else if (item.type === 'CUSTOMER') {
			// send customer email
			// set reminders
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
