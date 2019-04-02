const moment = require('moment');

const sendEmail = require('./SendEmail.js');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

async function sendTaskValidationEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-fd9cee6d49d54e179210d5a080e58fb3',
	});
}

async function sendItemContentAcquisitionEmail({email, ...data}) {
	return sendEmail({
		email: 'edwige@inyo.me',
		data,
		templateId: 'd-1b94796059eb45d49fbafafa101f5ddd',
	});
}

async function setupItemReminderEmail({
	email,
	userEmail,
	user,
	customerName,
	projectName,
	itemName,
	items,
	url,
	itemId,
	issueDate,
}) {
	const dates = [
		/* 5 min before actually sending it */ {
			date: moment(issueDate).add(5, 'minutes'),
			templateId: 'd-90847153d18843ad97755874cf092130',
			reminderType: 'DELAY',
			email,
		},
		/* 2 days */ {
			date: moment(issueDate).add(2, 'days'),
			templateId: 'd-e39a839701644fd9935f437056ad535a',
			reminderType: 'FIRST',
			email,
		},
		/* 3 days */ {
			date: moment(issueDate).add(2 + 3, 'days'),
			templateId: 'd-4ad0e13f00dd485ca0d98fd1d62cd7f6',
			reminderType: 'SECOND',
			email,
		},
		/* 1 day */ {
			date: moment(issueDate).add(2 + 3 + 1, 'days'),
			templateId: 'd-97b5ce25a4464a3888b359ac02f34168',
			reminderType: 'LAST',
			email,
		},
		/* 1 day */ {
			date: moment(issueDate).add(2 + 3 + 1 + 1, 'days'),
			templateId: 'd-f0a78ca3f43d4f558afa87dc32d3905d',
			reminderType: 'USER_WARNING',
			email: userEmail,
		},
	];

	return Promise.all(
		dates.map(async ({
			date, templateId, reminderType, email: emailToSend,
		}) => {
			try {
				await createPosthookReminder({
					type: reminderType,
					postAt: date.format(),
					data: {
						templateId,
						email: emailToSend,
						itemId,
						user,
						customerName,
						projectName,
						itemName,
						items,
						url,
					},
					item: {
						connect: {id: itemId},
					},
				});
			}
			catch (error) {
				console.error(
					`Reminder of type '${reminderType}' for item '${itemId}' NOT created in posthook.`,
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
