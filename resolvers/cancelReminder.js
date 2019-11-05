const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');
const cancelPosthookReminder = require('../reminders/cancelReminder');

const cancelReminder = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [reminder] = await ctx.db.reminders({
		where: {
			id,
			type_in: [
				'DELAY',
				'FIRST',
				'SECOND',
				'LAST',
				'INVOICE_DELAY',
				'INVOICE_FIRST',
				'INVOICE_SECOND',
				'INVOICE_THIRD',
				'INVOICE_FOURTH',
				'INVOICE_LAST',
			],
			item: createItemOwnerFilter(userId),
		},
	});

	if (!reminder) {
		throw new NotFoundError(`Reminder '${id}' has not been found.`);
	}

	if (reminder.status === 'CANCELED') {
		return reminder;
	}

	try {
		cancelPosthookReminder(reminder.postHookId);
	}
	catch (err) {
		console.error(`Errors cancelling pending reminder '${id}'`, err);
	}

	const canceledReminder = await ctx.db.updateReminder({
		where: {id},
		data: {status: 'CANCELED'},
	});

	console.log(`Canceled reminder '${id}'.`);

	await ctx.db.createUserEvent({
		type: 'CANCELED_REMINDER',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id,
		},
		reminder: {
			connect: {id},
		},
	});

	return canceledReminder;
};

module.exports = {
	cancelReminder,
};
