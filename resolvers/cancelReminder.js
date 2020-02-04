const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');
const cancelPosthookReminder = require('../reminders/cancelReminder');
const {scheduleEveningEmail} = require('../reminders/scheduleEveningEmail');

const cancelReminder = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);

	if (id.includes('_report')) {
		const customerReportId = id.replace('_report', '');

		let [eveningReminder] = await ctx.db.reminders({
			where: {
				id,
				type: 'EVENING_RECAP',
				eveningRemindersUser: {id: userId},
			},
		});
		const customer = await ctx.db.customer({id: customerReportId});
		const user = await ctx.db.user({id: userId});

		if (
			eveningReminder
			&& !eveningReminder.metadata.canceledReports[customerReportId]
		) {
			eveningReminder.metadata.canceledReports[customerReportId] = true;

			ctx.db.updateReminder({
				where: {
					id: eveningReminder.id,
				},
				data: {
					metadata: eveningReminder.metadata,
				},
			});
		}
		else {
			const now = new Date();
			const willEndWorkAt = new Date(
				`${now.toJSON().split('T')[0]}T${user.endWorkAt.split('T')[1]}`,
			);

			if (now - willEndWorkAt > 0) {
				willEndWorkAt.setDate(willEndWorkAt.getDate() + 1);
			}

			const metadata = {canceledReports: {[customerReportId]: true}};

			eveningReminder = await scheduleEveningEmail(
				user,
				willEndWorkAt,
				metadata,
			);
		}

		return {
			id,
			type: 'CUSTOMER_REPORT',
			customer,
			status: 'CANCELED',
			sendingDate: eveningReminder.sendingDate,
		};
	}

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
				'CONTENT_ACQUISITION_DELAY',
				'CONTENT_ACQUISITION_FIRST',
				'CONTENT_ACQUISITION_SECOND',
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
