const moment = require('moment');
const {sendReminderEmail} = require('../events');
const {
	createItemOwnerFilter,
	formatFullName,
	formatName,
	getUserId,
	getAppUrl,
} = require('../utils');
const getTemplateId = require('../emails/getTemplateId');

const gql = String.raw;

const templatesId = {
	DELAY: 'd-90847153d18843ad97755874cf092130',
	FIRST: 'd-e39a839701644fd9935f437056ad535a',
	SECOND: 'd-4ad0e13f00dd485ca0d98fd1d62cd7f6',
	LAST: 'd-97b5ce25a4464a3888b359ac02f34168',
};

const sendReminderTestEmail = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [reminder] = await ctx.db.reminders({
		where: {
			id,
			type_in: ['DELAY', 'FIRST', 'SECOND', 'LAST'],
			item: createItemOwnerFilter(userId),
		},
	}).$fragment(gql`
		fragment ReminderInfos on Reminder {
			type
			item {
				id
				name
				owner {
					firstName
					lastName
					email
				}
				linkedCustomer {
					token
					title
					firstName
					lastName
				}
				section {
					project {
						id
						name
						owner {
							firstName
							lastName
							email
						}
						customer {
							token
							title
							firstName
							lastName
							serviceCompany {
								owner {
									firstName
									lastName
									email
								}
							}
						}
					}
				}
			}
		}
	`);

	if (!reminder) {
		throw new Error(`Reminder '${id}' has not been found.`);
	}

	const {type, item} = reminder;

	let user = item.owner;

	let customer = item.linkedCustomer;

	if (item.section) {
		const {project} = item.section;

		customer = item.linkedCustomer || project.customer;
		user = user || project.owner || customer.serviceCompany.owner;
	}

	const basicInfos = {
		meta: {userId},
		templateId: getTemplateId(templatesId[type], ctx),
		email: user.email,

		userEmail: user.email,
		user: formatName(user.firstName, user.lastName),
		itemId: item.id,
		itemName: item.name,
		formattedIssueDate: moment().format('DD/MM/YYYY'),
	};

	if (item.section) {
		if (
			item.linkedCustomer
			&& item.linkedCustomer !== item.section.project.customer
		) {
			const {linkedCustomer} = item;

			await sendReminderEmail(
				{
					...basicInfos,
					customerName: String(
						` ${formatFullName(
							linkedCustomer.title,
							linkedCustomer.firstName,
							linkedCustomer.lastName,
						)}`,
					).trimRight(),
					customerEmail: linkedCustomer.email,
					customerPhone: linkedCustomer.phone,
					projectName: item.section.project.name,
					url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
				},
				ctx,
			);

			return true;
		}

		if (item.section.project.customer) {
			await sendReminderEmail(
				{
					...basicInfos,
					customerName: String(
						` ${formatFullName(
							customer.title,
							customer.firstName,
							customer.lastName,
						)}`,
					).trimRight(),
					customerEmail: customer.email,
					customerPhone: customer.phone,
					projectName: item.section.project.name,
					url: getAppUrl(
						`/${customer.token}/tasks/${item.id}?projectId=${
							item.section.project.id
						}`,
					),
				},
				ctx,
			);

			return true;
		}

		throw new Error('The task linked to the reminder has no customer.');
	}
	else if (item.linkedCustomer) {
		const {linkedCustomer} = item;

		await sendReminderEmail(
			{
				...basicInfos,
				customerName: String(
					` ${formatFullName(
						linkedCustomer.title,
						linkedCustomer.firstName,
						linkedCustomer.lastName,
					)}`,
				).trimRight(),
				customerEmail: linkedCustomer.email,
				customerPhone: linkedCustomer.phone,
				url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
			},
			ctx,
		);

		return true;
	}

	throw new Error('The task linked to the reminder has no customer.');
};

module.exports = {
	sendReminderTestEmail,
};
