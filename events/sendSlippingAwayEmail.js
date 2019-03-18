const moment = require('moment-timezone');

const {prisma} = require('../generated/prisma-client');
const {formatName} = require('../utils');
const {sendSlippingAwayEmail: sendEmail} = require('../emails/UserEmail');

const sendSlippingAwayEmail = async ({userId}) => {
	const [user] = await prisma.users({
		where: {
			id: userId,
			// confirm the user didn't come since the last 3 days
			userEvents_none: {
				createdAt_gt: moment()
					.subtract(3, 'days')
					.format(),
			},
		},
	});

	if (!user) {
		console.log(
			userId,
			'has not been found, he might have come back between the mail scheduling and now.',
		);
		return {status: 'CANCELED'};
	}

	await sendEmail({
		email: user.email,
		user: formatName(user.firstName, user.lastName),
		emailForSurvey: user.email,
	});

	console.log("Sent today's slipping away prevention to", user.email);
	return {status: 'SENT'};
};

module.exports = {
	sendSlippingAwayEmail,
};
