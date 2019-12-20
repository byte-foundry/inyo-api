const moment = require('moment-timezone');

const gql = String.raw;

const {prisma} = require('../generated/prisma-client');
const {getAppUrl, formatFullName, formatName} = require('../utils');
const {sendCustomerEveningEmail} = require('../emails/CustomerEmail');

const weekDays = {
	1: 'MONDAY',
	2: 'TUESDAY',
	3: 'WEDNESDAY',
	4: 'THURSDAY',
	5: 'FRIDAY',
	6: 'SATURDAY',
	0: 'SUNDAY',
};

const sendCustomersRecapEmail = async ({userId}, {metadata = {}}) => {
	let user = await prisma.user({id: userId});

	if (!user.startWorkAt) {
		console.log(
			'The user has not configured its starting work hour. How could we tell from when we should send completed tasks?',
		);
		return;
	}

	const now = new Date();
	const startedWorkAt = new Date(
		`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
	);

	if (now - startedWorkAt < 0) {
		startedWorkAt.setDate(startedWorkAt.getDate() - 1);
	}

	const dayNumber = moment(startedWorkAt)
		.tz(user.timeZone || 'Europe/Paris')
		.day();

	// the user was not working today, second round
	if (!user.workingDays.includes(weekDays[dayNumber])) {
		console.log(
			`Prevented an evening email for ${
				user.email
			}'s client on a day off. Is scheduling function wrong?`,
		);
		return;
	}

	const itemFilter = `
		type_in: [DEFAULT]
		status: FINISHED
		finishedAt_gte: "${startedWorkAt.toJSON()}"
	`;

	const canceledReportsIds = Object.entries(metadata.canceledReports || {})
		.filter(([, value]) => value)
		.map(([key]) => key);

	user = await prisma.user({id: userId}).$fragment(gql`
		fragment UserFinishedTasks on User {
			email
			firstName
			lastName
			settings {
				language
			}
			company {
				customers(
					where: {
						OR: [{
							linkedTasks_some: {
								${itemFilter}
							}
						}, {
							projects_some: {
								status_in: [ONGOING, ARCHIVED]
								notifyActivityToCustomer: true
								sections_some: { items_some: { ${itemFilter} } }
							}
						}]
						NOT: {
							id_in: [${canceledReportsIds.join(',')}]
						}
					}
				) {
					id
					title
					firstName
					lastName
					email
					token
					linkedTasks(
						where: {
							${itemFilter}
						}
					) {
						name
					}
					projects(
						where: {
								status_in: [ONGOING, ARCHIVED]
							notifyActivityToCustomer: true
							sections_some: { items_some: { ${itemFilter} } }
						}
					) {
						id
						name
						sections(orderBy: position_ASC, where: { items_some: { ${itemFilter} } }) {
							items(orderBy: position_ASC, where: { ${itemFilter} }) {
								name
								assignee {
									firstName
									lastName
								}
							}
						}
					}
				}
			}
		}
	`);

	if (!user.company.customers.length) {
		console.log(
			`User '${user.email}' is shy or lazy and did nothing today, aborting.`,
		);
		return;
	}

	await Promise.all(
		user.company.customers.map(async (customer) => {
			await sendCustomerEveningEmail(
				{
					meta: {userId},
					email: customer.email,
					user: formatName(user.firstName, user.lastName),
					customerName: String(
						` ${formatFullName(
							customer.title,
							customer.firstName,
							customer.lastName,
						)}`,
					).trimRight(),
					userId,
					customerId: customer.id,
					projects: customer.projects.map(project => ({
						...project,
						sections: project.sections.map(section => ({
							...section,
							items: section.items.map(item => ({
								...item,
								assignee: item.assignee
									? formatName(item.assignee.firstName, item.assignee.lastName)
									: undefined,
							})),
						})),
						url: getAppUrl(`/${customer.token}/tasks?projectId=${project.id}`),
					})),
					tasks: customer.linkedTasks.map(task => ({
						...task,
						url: getAppUrl(`/${customer.token}/tasks/${task.id}`),
					})),
				},
				{db: prisma, language: user.settings.language},
			);

			console.log(
				`Sent today's '${user.email}'s completed tasks to ${customer.email}`,
			);
		}),
	);

	console.log(
		`Sent today's all completed tasks to '${user.email}'s customers.`,
	);
};

module.exports = {
	sendCustomersRecapEmail,
};
