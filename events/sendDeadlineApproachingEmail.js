const moment = require('moment-timezone');

const {prisma} = require('../generated/prisma-client');
const {formatName} = require('../utils');
const {sendDeadlineApproachingMail: sendEmail} = require('../emails/UserEmail');

const sendDeadlineApproachingEmail = async ({userId}) => {
	const [user] = await prisma.users({
		where: {
			id: userId,
			// confirm the user didn't come since the last 3 days
			userEvents_none: {
				createdAt_gt: moment().subtract(2, 'days'),
			},
			// verifying the deadline is after this email
			// TODO: what about if it was 5 min before?
			OR: [
				{
					tasks_some: {
						dueDate_lt: moment().add(1, 'days'),
						dueDate_gt: moment(),
						OR: [
							{
								section: null,
							},
							{
								section: {
									project: {
										status: 'ONGOING',
									},
								},
							},
						],
					},
				},
				{
					projects: {
						deadline_lt: moment().add(1, 'days'),
						deadline_gt: moment(),
						status: 'ONGOING',
					},
				},
			],
		},
	});

	if (!user) {
		console.log(
			userId,
			'has not been found, he might have change/pass the deadline between the mail scheduling and now.',
		);
		return {status: 'CANCELED'};
	}

	await sendEmail(
		{
			meta: {userId},
			email: user.email,
			user: formatName(user.firstName, user.lastName),
		},
		{db: prisma},
	);

	console.log("Sent today's deadline approaching email to", user.email);
	return {status: 'SENT'};
};

module.exports = {
	sendDeadlineApproachingEmail,
};
