const moment = require('moment');

const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

async function sendTaskValidationEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-fd9cee6d49d54e179210d5a080e58fb3', ctx),
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
			templateId: getTemplateId('d-1b94796059eb45d49fbafafa101f5ddd', ctx),
		},
		ctx,
	);
}

const remindersSequences = {
	CUSTOMER: [
		/* 5 min before actually sending it */ {
			delay: moment.duration(5, 'minutes').asSeconds(),
			sendingDate: moment().add(5, 'minutes'),
			type: 'DELAY',
		},
		/* 2 days */ {
			delay: moment.duration(2, 'days').asSeconds(),
			sendingDate: moment().add(2, 'days'),
			type: 'FIRST',
		},
		/* 3 days */ {
			delay: moment.duration(2 + 3, 'days').asSeconds(),
			sendingDate: moment().add(2 + 3, 'days'),
			type: 'SECOND',
		},
		/* 1 day */ {
			delay: moment.duration(2 + 3 + 1, 'days').asSeconds(),
			type: 'LAST',
		},
	],
	INVOICE: [
		/* 5 min before actually sending it */ {
			delay: moment.duration(5, 'minutes').asSeconds(),
			type: 'INVOICE_DELAY',
		},
		/* 2 days */ {
			delay: moment.duration(12, 'days').asSeconds(),
			type: 'INVOICE_FIRST',
		},
		/* 3 days */ {
			delay: moment.duration(20, 'days').asSeconds(),
			type: 'INVOICE_SECOND',
		},
		/* 1 day */ {
			delay: moment.duration(25, 'days').asSeconds(),
			type: 'INVOICE_THIRD',
		},
		/* 1 day */ {
			delay: moment.duration(30, 'days').asSeconds(),
			type: 'INVOICE_FOURTH',
		},
		/* 1 day */ {
			delay: moment.duration(40, 'days').asSeconds(),
			type: 'INVOICE_LAST',
		},
	],
};

const reminderTypesTemplateIds = {
	DELAY: 'd-90847153d18843ad97755874cf092130',
	FIRST: 'd-e39a839701644fd9935f437056ad535a',
	SECOND: 'd-4ad0e13f00dd485ca0d98fd1d62cd7f6',
	LAST: 'd-97b5ce25a4464a3888b359ac02f34168',
	USER_WARNING: 'd-f0a78ca3f43d4f558afa87dc32d3905d',
	INVOICE_DELAY: 'd-9fbbba215e7e47fc81482ae86e5ca6b9',
	INVOICE_FIRST: 'd-e8d66688a551478bb54d2000380d5a1e',
	INVOICE_SECOND: 'd-54e1e542af7b42a88d330b1b5c590747',
	INVOICE_THIRD: 'd-9711c3779d3043f8a477b3a7cc8940b3',
	INVOICE_FOURTH: 'd-ccf43fb2df0e4822a22bc55fe02ced4a',
	INVOICE_LAST: 'd-45388ea561144c57831c6d69241d31f3',
};

async function setupItemReminderEmail(
	{
		email,
		userEmail,
		url,
		userUrl,
		itemId,
		issueDate,
		reminders,
		taskType,
		...rest
	},
	ctx,
) {
	const dates = [...(reminders || remindersSequences[taskType])];

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
						...rest,
						templateId: getTemplateId(reminderTypesTemplateIds[type], ctx),
						email: type === 'USER_WARNING' ? userEmail : email,
						itemId,
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
	remindersSequences,
	sendTaskValidationEmail,
	sendItemContentAcquisitionEmail,
	setupItemReminderEmail,
	reminderTypesTemplateIds,
};
