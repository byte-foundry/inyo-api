const moment = require('moment');

const sendEmail = require('./SendEmail.js');
const createReminder = require('../reminders/createReminder');

async function sendTaskValidationEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-fd9cee6d49d54e179210d5a080e58fb3',
	});
}

async function sendTaskValidationWaitCustomerEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-396ebbf7d15e490da4b0b4b86d5f77b0',
	});
}

async function sendItemContentAcquisitionEmail({email, ...data}) {
	return sendEmail({
		email: 'edwige@inyo.me',
		data,
		templateId: 'd-1b94796059eb45d49fbafafa101f5ddd',
	});
}

async function setupItemReminderEmail(
	{
		email,
		userEmail,
		user,
		customerName,
		projectName,
		itemName,
		items,
		nextItemName,
		nextItemDescription,
		url,
		itemId,
		issueDate,
	},
	ctx,
) {
	const dates = [
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

	dates.forEach(
		async ({
			date, templateId, reminderType, email: emailToSend,
		}) => {
			try {
				const {data} = await createReminder({
					email: emailToSend,
					data: {
						user,
						customerName,
						projectName,
						itemName,
						items,
						nextItemName,
						nextItemDescription,
						url,
					},
					postDate: date.format(),
					templateId,
				});

				try {
					const reminder = await ctx.db.createReminder({
						item: {
							connect: {id: itemId},
						},
						postHookId: data.id,
						type: reminderType,
						sendingDate: date.format(),
						status: 'PENDING',
					});

					console.log(
						`Reminder '${
							reminder.id
						}' of type '${reminderType}' created with posthook id '${
							data.id
						}'.`,
					);
				}
				catch (error) {
					// Here we should do something to store the errors
					console.error(
						`Reminder of type '${reminderType}' NOT created with posthook id '${
							data.id
						}'`,
						error,
					);
				}
			}
			catch (error) {
				console.error(
					`Reminder of type '${reminderType}' for item '${itemId}' NOT created in posthook.`,
					error,
				);
			}
		},
	);
}

module.exports = {
	sendTaskValidationEmail,
	sendTaskValidationWaitCustomerEmail,
	sendItemContentAcquisitionEmail,
	setupItemReminderEmail,
};
