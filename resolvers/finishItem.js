const gql = String.raw;

const {
	getUserId,
	getAppUrl,
	formatFullName,
	formatName,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
	isCustomerTask,
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
			id
			name
			status
			unit
			type
			owner {
				id
				email
				firstName
				lastName
			}
			linkedCustomer {
				id
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
			assignee {
				id
			}
			section {
				project {
					id
					customer {
						id
						title
						firstName
						lastName
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
							section: {
								project: {
									OR: [{token}, {customer: {token}}],
								},
							},
						},
						{
							linkedCustomer: {token},
						},
					],
				},
			})
			.$fragment(fragment);

		if (!isCustomerTask(item)) {
			throw new Error('This item cannot be finished by the customer.');
		}

		if (item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const user = item.owner;

		let customer = item.linkedCustomer;

		if (item.section) {
			const {project} = item.section;

			customer = customer || project.customer;
		}

		try {
			await sendTaskValidationEmail(
				{
					meta: {userId: user.id},
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
				},
				ctx,
			);
			console.log(`Task validation email sent to ${user.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}

		await cancelPendingReminders(item.pendingReminders, id, ctx);

		const finishedItem = await ctx.db.updateItem({
			where: {id},
			data: {
				status: 'FINISHED',
				finishedAt: new Date(),
			},
		});

		await ctx.db.createCustomerEvent({
			type: 'FINISHED_TASK',
			customer: {
				connect: {id: customer.id},
			},
			metadata: {id: finishedItem.id},
			notifications: {
				create: {
					user: {connect: {id: user.id}},
				},
			},
			task: {
				connect: {id: finishedItem.id},
			},
		});

		return finishedItem;
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				AND: [
					{id},
					{
						OR: [
							createItemOwnerFilter(userId),
							createItemCollaboratorFilter(userId),
						],
					},
				],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (isCustomerTask(item)) {
		throw new Error('This item cannot be finished by the user.');
	}

	await cancelPendingReminders(item.pendingReminders, id, ctx);

	const updatedItem = await ctx.db.updateItem({
		where: {id},
		data: {
			status: 'FINISHED',
			finishedAt: new Date(),
			timeItTook,
		},
	});

	// wasn't already finished
	if (item.status === 'PENDING') {
		await ctx.db.createUserEvent({
			type: 'FINISHED_TASK',
			user: {
				connect: {id: userId},
			},
			metadata: {
				id: updatedItem.id,
			},
			notifications: item.assignee
				&& item.assignee.id === userId && {
				create: {
					user: {connect: {id: item.owner.id}},
				},
			},
			task: {
				connect: {id: updatedItem.id},
			},
			project: item.section && {
				connect: {id: item.section.project.id},
			},
		});
	}

	return updatedItem;
};

module.exports = {
	finishItem,
};
