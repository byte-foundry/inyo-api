const gql = String.raw;

const {
	getUserId,
	getAppUrl,
	formatFullName,
	formatName,
	createItemOwnerFilter,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendTaskValidationEmail} = require('../emails/TaskEmail');
const cancelReminder = require('../reminders/cancelReminder');

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

const finishItem = async (parent, {id, token, timeItTook}, ctx) => {
	const fragment = gql`
		fragment ItemWithProject on Item {
			name
			status
			unit
			owner {
				email
				firstName
				lastName
			}
			linkedCustomer {
				title
				firstName
				lastName
			}
			pendingReminders: reminders(where: {status: PENDING}) {
				id
				postHookId
				type
				status
			}
			section {
				project {
					customer {
						title
						firstName
						lastName
						serviceCompany {
							owner {
								email
								firstName
								lastName
							}
						}
					}
				}
			}
		}
	`;

	// Customer can finish item only in project
	// PROJECT
	if (token) {
		const [item] = await ctx.db
			.items({
				where: {
					id,
					OR: [
						{
							section: {project: {token}},
						},
						{
							linkedCustomer: {token},
						},
					],
				},
			})
			.$fragment(fragment);

		if (item.type !== 'CUSTOMER') {
			throw new Error('This item cannot be finished by the customer.');
		}

		if (item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		let user;
		let customer;

		if (item.section) {
			const {project} = item.section;

			user = project.customer.serviceCompany.owner;
			({customer} = project);
		}
		else {
			user = item.owner;
			customer = item.linkedCustomer;
		}

		try {
			await sendTaskValidationEmail({
				email: user.email,
				user: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				customerName: String(
					` ${formatName(user.firstName, user.lastName)}`,
				).trimRight(),
				itemName: item.name,
				url: getAppUrl(`/tasks/${item.id}`),
			});
			console.log(`Task validation email sent to ${user.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}

		await cancelPendingReminders(item.pendingReminders, id, ctx);

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'FINISHED',
				finishedAt: new Date(),
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				AND: [{id}, createItemOwnerFilter(userId)],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.type === 'CUSTOMER') {
		throw new Error('This item cannot be finished by the user.');
	}

	if (item.status !== 'PENDING') {
		throw new Error(`Item '${id}' cannot be finished.`);
	}

	await cancelPendingReminders(item.pendingReminders, id, ctx);

	return ctx.db.updateItem({
		where: {id},
		data: {
			status: 'FINISHED',
			finishedAt: new Date(),
			timeItTook: timeItTook || item.unit,
		},
	});
};

module.exports = {
	finishItem,
};
