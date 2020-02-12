const gql = String.raw;
const moment = require('moment');

const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');
const {
	getAppUrl,
	formatName,
	formatFullName,
	filterDescription,
	renderTemplate,
} = require('../utils');

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

const UserForEmail = gql`
	fragment UserForEmail on User {
		id
		email
		firstName
		lastName
		settings {
			assistantName
		}
	}
`;

const TemplateWithType = gql`
	fragment TemplateWithType on EmailTemplate {
		id
		subject
		content
		timing
		type {
			category
			name
		}
	}
`;

const ItemForReminder = gql`
	fragment ItemForReminder on Item {
		id
		type
		name
		description
		attachments {
			id
			url
			filename
		}
		section {
			project {
				id
				customer {
					token
				}
			}
		}
	}
`;

async function sendItemContentAcquisitionEmail(
	{
		userId, customerId, itemId, projectId,
	},
	ctx,
) {
	const meta = {userId};
	const item = await ctx.db.item({id: itemId}).$fragment(ItemForReminder);
	const customTemplates = await ctx.db
		.emailTemplates({
			where: {
				type: {
					category: 'CONTENT_ACQUISITION',
				},
				owner: {
					id: userId,
				},
			},
		})
		.$fragment(TemplateWithType);

	if (customTemplates.length > 0) {
		const renderedTemplates = await Promise.all(
			customTemplates.map(async (templateToRender) => {
				const [
					renderedSubject,
					renderedContent,
					emailArgs,
				] = await renderTemplate({
					template: templateToRender,
					userId,
					taskId: itemId,
					customerId,
					projectId,
					ctx,
				});

				return {
					emailArgs,
					subject: renderedSubject,
					content: renderedContent,
					timing: templateToRender.timing,
				};
			}),
		);

		return sendEmail(
			{
				email: 'edwige@inyo.me',
				meta,
				data: {
					description: item.description,
					adminLink: getAppUrl(
						`/${process.env.ADMIN_TOKEN}/tasks/${itemId}${
							projectId ? `?projectId=${projectId}` : ''
						}`,
					),
					customerEmail: renderedTemplates[0].emailArgs.customer.email,
					timingDelay: `${renderedTemplates[0].timing.value} ${
						renderedTemplates[0].timing.unit
					}`,
					subjectDelay: renderedTemplates[0].subject,
					contentDelay: renderedTemplates[0].content,
					timingFirst: `${renderedTemplates[1].timing.value} ${
						renderedTemplates[1].timing.unit
					}`,
					subjectFirst: renderedTemplates[1].subject,
					contentFirst: renderedTemplates[1].content,
					timingSecond: `${renderedTemplates[2].timing.value} ${
						renderedTemplates[2].timing.unit
					}`,
					subjectSecond: renderedTemplates[2].subject,
					contentSecond: renderedTemplates[2].content,
				},
				templateId: 'd-808373ed32284bada8c56ef4d087a95e',
			},
			ctx,
		);
	}

	const customer = await ctx.db.customer({id: customerId});
	const user = await ctx.db.user({id: userId}).$fragment(UserForEmail);

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

	let userUrl = getAppUrl(`/tasks/${itemId}`);

	const {project} = item.section || {};

	if (item.section) {
		userUrl = getAppUrl(`/tasks/${item.id}?projectId=${project.id}`);
	}

	const basicInfos = {
		meta: {userId},
		itemId: item.id,
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
		assistantName: user.settings.assistantName,
		userUrl,
		url,
		description: filterDescription(item.description),
		fileUrls: item.attachments,
		userEmail: user.email,
		name: item.name,
	};

	return sendEmail(
		{
			email: 'edwige@inyo.me',
			data: basicInfos,
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
		/* +2 days */ {
			delay: moment.duration(2, 'days').asSeconds(),
			sendingDate: moment().add(2, 'days'),
			type: 'FIRST',
		},
		/* +3 days */ {
			delay: moment.duration(5, 'days').asSeconds(),
			sendingDate: moment().add(5, 'days'),
			type: 'SECOND',
		},
		/* +1 day */ {
			delay: moment.duration(6, 'days').asSeconds(),
			sendingDate: moment().add(6, 'days'),
			type: 'LAST',
		},
	],
	INVOICE: [
		/* 5 min before actually sending it */ {
			delay: moment.duration(5, 'minutes').asSeconds(),
			sendingDate: moment().add(5, 'minutes'),
			type: 'INVOICE_DELAY',
		},
		/* +12 days */ {
			delay: moment.duration(12, 'days').asSeconds(),
			sendingDate: moment().add(12, 'days'),
			type: 'INVOICE_FIRST',
		},
		/* +8 days */ {
			delay: moment.duration(20, 'days').asSeconds(),
			sendingDate: moment().add(20, 'days'),
			type: 'INVOICE_SECOND',
		},
		/* +5 days */ {
			delay: moment.duration(25, 'days').asSeconds(),
			sendingDate: moment().add(25, 'days'),
			type: 'INVOICE_THIRD',
		},
		/* +5 days */ {
			delay: moment.duration(30, 'days').asSeconds(),
			sendingDate: moment().add(30, 'days'),
			type: 'INVOICE_FOURTH',
		},
		/* +5 days */ {
			delay: moment.duration(40, 'days').asSeconds(),
			sendingDate: moment().add(40, 'days'),
			type: 'INVOICE_LAST',
		},
	],
	CONTENT_ACQUISITION: [
		/* 5 min before actually sending it */ {
			delay: moment.duration(5, 'minutes').asSeconds(),
			sendingDate: moment().add(5, 'minutes'),
			type: 'CONTENT_ACQUISITION_DELAY',
		},
		/* +3 days */ {
			delay: moment.duration(3, 'days').asSeconds(),
			sendingDate: moment().add(3, 'days'),
			type: 'CONTENT_ACQUISITION_FIRST',
		},
		/* +4 days */ {
			delay: moment.duration(7, 'days').asSeconds(),
			sendingDate: moment().add(7, 'days'),
			type: 'CONTENT_ACQUISITION_SECOND',
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
	CONTENT_ACQUISITION_DELAY: 'd-1c7c39346ae94c1799731c4ac881ddca',
	CONTENT_ACQUISITION_FIRST: 'd-026e1ab5d23c49c7bdbafa8fb0f97e1d',
	CONTENT_ACQUISITION_SECOND: 'd-88e212fdb4ee4bc7b5b7acb0ed4613a2',
	CUSTOM: 'd-9feaaa66a50a4dd0bcde2d98d41b3737',
};

async function setupItemReminderEmail(
	{
		itemId, userId, customerId, projectId, reminders, issueDate,
	},
	ctx,
) {
	const item = await ctx.db.item({id: itemId}).$fragment(ItemForReminder);

	const customTemplates = await ctx.db
		.emailTemplates({
			where: {
				type: {
					category: item.type,
				},
				owner: {
					id: userId,
				},
			},
		})
		.$fragment(TemplateWithType);

	const dates = [...(reminders || remindersSequences[item.type])];

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
			const templateToUse = customTemplates.find(t => t.type.name === type);

			if (templateToUse) {
				const [
					renderedSubject,
					renderedContent,
					emailArgs,
				] = await renderTemplate({
					template: templateToUse,
					userId,
					taskId: itemId,
					customerId,
					projectId,
					ctx,
				});

				try {
					await createPosthookReminder({
						type,
						postAt: moment(issueDate)
							.add(delay, 'seconds')
							.format(),
						data: {
							subject: renderedSubject,
							content: renderedContent,
							templateId: reminderTypesTemplateIds.CUSTOM,
							email: emailArgs.customer.email,
							recipientIsUser: type === 'USER_WARNING',
							recipientId: type === 'USER_WARNING' ? userId : customerId,
							itemId,
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
			}
			else {
				const customer = await ctx.db.customer({id: customerId});
				const user = await ctx.db.user({id: userId}).$fragment(UserForEmail);

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

				let userUrl = getAppUrl(`/tasks/${itemId}`);

				const {project} = item.section || {};

				if (item.section) {
					userUrl = getAppUrl(`/tasks/${item.id}?projectId=${project.id}`);
				}

				const docs = Array.from(
					item.description.matchAll(/(?:^- \[([\sx])] (.*)$)+/gm),
				).map(m => ({
					checked: m[1] === 'x',
					name: m[2],
				}));

				const basicInfos = {
					meta: {userId},
					itemId: item.id,
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
					formattedIssueDate: moment(issueDate).format('DD/MM/YYYY'),
					assistantName: user.settings.assistantName,
					templateId: getTemplateId(reminderTypesTemplateIds[type], ctx),
					email: type === 'USER_WARNING' ? user.email : customer.email,
					userUrl,
					url: type === 'USER_WARNING' ? userUrl : url,
					description: filterDescription(item.description),
					fileUrls: item.attachments,
					userEmail: user.email,
					recipientIsUser: type === 'USER_WARNING',
					recipientId: type === 'USER_WARNING' ? userId : customerId,
					docs,
				};

				try {
					await createPosthookReminder({
						type,
						postAt: moment(issueDate)
							.add(delay, 'seconds')
							.format(),
						data: {
							...basicInfos,
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
