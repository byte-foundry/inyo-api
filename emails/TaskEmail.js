const moment = require('moment');

const sendEmail = require('./SendEmail.js');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

async function sendTaskValidationEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-fd9cee6d49d54e179210d5a080e58fb3',
		},
		ctx,
	);
}

async function sendItemContentAcquisitionEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email: 'edwige@inyo.me',
			meta,
			data,
			templateId: 'd-1b94796059eb45d49fbafafa101f5ddd',
		},
		ctx,
	);
}

const reminderTypesTemplateIds = {
	DELAY: 'd-90847153d18843ad97755874cf092130',
	FIRST: 'd-e39a839701644fd9935f437056ad535a',
	SECOND: 'd-4ad0e13f00dd485ca0d98fd1d62cd7f6',
	LAST: 'd-97b5ce25a4464a3888b359ac02f34168',
	USER_WARNING: 'd-f0a78ca3f43d4f558afa87dc32d3905d',
};

async function setupItemReminderEmail({
	email,
	userEmail,
	user,
	customerName,
	projectName,
	itemName,
	items,
	url,
	userUrl,
	itemId,
	issueDate,
	reminders,
}) {
	const dates = reminders || [
		/* 5 min before actually sending it */ {
			delay: moment.duration(5, 'minutes').asSeconds(),
			type: 'DELAY',
		},
		/* 2 days */ {
			delay: moment.duration(2, 'days').asSeconds(),
			type: 'FIRST',
		},
		/* 3 days */ {
			delay: moment.duration(2 + 3, 'days').asSeconds(),
			type: 'SECOND',
		},
		/* 1 day */ {
			delay: moment.duration(2 + 3 + 1, 'days').asSeconds(),
			type: 'LAST',
		},
	];

	// adding user warning 1 day after last reminder
	if (dates.length > 0) {
		dates.push({
			delay:
				dates[dates.length - 1].delay + moment.duration(1, 'days').asSeconds(),
			type: 'USER_WARNING',
		});
	}

	return Promise.all(
		dates.map(async ({delay, type}) => {
			try {
				await createPosthookReminder({
					type,
					postAt: moment(issueDate)
						.add(delay, 'seconds')
						.format(),
					data: {
						templateId: reminderTypesTemplateIds[type],
						email: type === 'USER_WARNING' ? userEmail : email,
						itemId,
						user,
						customerName,
						projectName,
						itemName,
						items,
						url: type === 'USER_WARNING' ? userUrl : url,
					},
					item: {
						connect: {id: itemId},
					},
				});
			}
			catch (error) {
				console.error(
					`Reminder of type '${type}' for item '${itemId}' NOT created in posthook.`,
					error,
				);
			}
		}),
	);
}

module.exports = {
	sendTaskValidationEmail,
	sendItemContentAcquisitionEmail,
	setupItemReminderEmail,
};
