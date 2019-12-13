const {createPosthookReminder} = require('./createPosthookReminder');

const scheduleEveningEmail = async (user, endNextWorkDayAt, metadata) => {
	console.log('Scheduling evening emails for', user.email);

	return createPosthookReminder({
		type: 'EVENING_RECAP',
		postAt: endNextWorkDayAt,
		eveningRemindersUser: {
			connect: {id: user.id},
		},
		user: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
		metadata,
	});
};

module.exports = {
	scheduleEveningEmail,
};
