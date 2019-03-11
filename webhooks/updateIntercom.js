const moment = require('moment');
const IntercomClient = require('intercom-client').Client;
const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

const intercom = new IntercomClient({token: process.env.INTERCOM_TOKEN});

const updateIntercom = async () => {
	console.log('Updating number of active days last 7 days.');

	let sessionsDayFragments = '';

	for (let index = 6; index >= 0; index--) {
		sessionsDayFragments += gql`
			day${index}: userEvents(where: {
				type: ME_CALL
				createdAt_gt: "${moment()
		.subtract(index + 1, 'days')
		.format()}"
				createdAt_lt: "${moment()
		.subtract(index, 'days')
		.format()}"
			}, first: 1) {
				createdAt
			}
		`;
	}

	// checking to whom we can send an evening mail
	const users = await prisma.users({
		where: {
			userEvents_some: {
				createdAt_gt: moment()
					.subtract(8, 'days')
					.format(),
			},
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			email
			${sessionsDayFragments}
		}
	`);

	await Promise.all(
		users.map((user) => {
			const sessions = [];

			for (let index = 6; index >= 0; index--) {
				sessions.push(...user[`day${index}`]);
			}

			const sessionsCount = sessions.length;

			return intercom.users.update({
				email: user.email,
				custom_attributes: {
					'active-days-last-7-days': sessionsCount,
				},
			});
		}),
	);

	console.log('Updated number of active days last 7 days.');
};

module.exports = {
	updateIntercom,
};
