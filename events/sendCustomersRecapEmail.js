const moment = require('moment-timezone');

const gql = String.raw;

const {prisma} = require('../generated/prisma-client');
const {getAppUrl, titleNameEmail} = require('../utils');
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

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const sendCustomersRecapEmail = async ({userId}) => {
	let user = await prisma.user({id: userId});

	if (!user.endWorkAt) {
		console.log(
			'The user has not configured its ending work hour. How is it even possible to get there?',
		);
		return;
	}

	const now = new Date();
	const startedWorkAt = new Date(
		`${now.toJSON().split('T')[0]}T${user.endWorkAt.split('T')[1]}`,
	);

	if (now - startedWorkAt > 0) {
		startedWorkAt.setDate(startedWorkAt.getDate() + 1);
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
		status: FINISHED
		finishedAt_gte: ${startedWorkAt}
	`;

	user = await prisma.user({id: userId}).$fragment(gql`
		fragment UserFinishedTasks on User {
			email
			firstName
			lastName
			company {
				customers(
					where: {
						projects_some: { sections_some: { items_some: { ${itemFilter} } } }
					}
				) {
					title
					firstName
					lastName
					email
					projects(
						where: { sections_some: { items_some: { ${itemFilter} } } }
					) {
						id
						token
						name
						sections(where: { items_some: { ${itemFilter} } }) {
							items(where: { ${itemFilter} }) {
								name
							}
						}
					}
				}
			}
		}
	`);

	await Promise.all(
		user.company.customers.map(async (customer) => {
			if (customer.projects.length <= 0) {
				console.log(
					`User '${user.email}' did not complete any tasks for ${
						customer.email
					} today, aborting.`,
				);
				return;
			}

			await sendCustomerEveningEmail({
				email: customer.email,
				user: `${user.firstName} ${user.lastName}`.trim(),
				customerName: titleNameEmail` ${titleToCivilite[customer.title]} ${
					customer.firstName
				} ${customer.lastName}`,
				projects: customer.projects.map(project => ({
					...project,
					url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
				})),
			});

			console.log(`Sent today's completed tasks to ${customer.email}`);
		}),
	);

	console.log(`Sent today's completed tasks to '${user.email}'s customers.`);
};

module.exports = {
	sendCustomersRecapEmail,
};
