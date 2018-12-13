const moment = require('moment-timezone');

const {prisma} = require('../generated/prisma-client');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

const gql = String.raw;

const weekDays = {
	1: 'MONDAY',
	2: 'TUESDAY',
	3: 'WEDNESDAY',
	4: 'THURSDAY',
	5: 'FRIDAY',
	6: 'SATURDAY',
	0: 'SUNDAY',
};

const scheduleMorningEmail = async (user, startNextWorkDayAt) => {
	console.log('Scheduling morning email for', user.email);

	return createPosthookReminder({
		type: 'MORNING_TASKS',
		postAt: startNextWorkDayAt,
		morningRemindersUser: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
	});
};

const scheduleEveningEmail = async (user, endNextWorkDayAt) => {
	console.log('Scheduling evening email for', user.email);

	return createPosthookReminder({
		type: 'EVENING_RECAP',
		postAt: endNextWorkDayAt,
		eveningRemindersUser: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
	});
};

const scheduleDailyMails = async (req, res) => {
	console.log('Scheduling daily mails');

	// checking to whom we can send a morning mail
	const morningUsers = await prisma.users({
		where: {
			startWorkAt_not: null,
			OR: [
				{
					morningReminders_some: {},
					morningReminders_every: {
						sendingDate_lt: new Date().toJSON(),
					},
				},
				{
					morningReminders_none: {},
				},
			],
		},
	}).$fragment(gql`
		fragment MorningWorkingUser on User {
			id
			email
			startWorkAt
			timeZone
			workingDays
		}
	`);

	morningUsers.forEach(async (user) => {
		const now = new Date();
		const startNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
		);

		if (now - startNextWorkDayAt > 0) {
			startNextWorkDayAt.setDate(startNextWorkDayAt.getDate() + 1);
		}

		const dayNumber = moment(startNextWorkDayAt)
			.tz(user.timeZone || 'Europe/Paris')
			.day();

		// don't schedule an email if it's not a worked day
		if (!user.workingDays.includes(weekDays[dayNumber])) {
			return;
		}

		await scheduleMorningEmail(user, startNextWorkDayAt);
	});

	// checking to whom we can send a morning mail
	// const eveningUsers = await prisma.users({
	// 	where: {
	// 		endWorkAt_not: null,
	// 		OR: [
	// 			{
	// 				eveningReminders_some: {},
	// 				eveningReminders_every: {
	// 					sendingDate_lt: new Date().toJSON()
	// 				},
	// 			},
	// 			{
	// 				eveningReminders_none: {},
	// 			},
	// 		],
	//   },
	// }).$fragment(gql`
	// 	fragment EveningWorkingUser on User {
	// 		id
	// 		endWorkAt
	// 	}
	// `);

	// eveningUsers.forEach(async (user) => {
	// 	const reminder = await scheduleEveningEmail(user);

	// 	await prisma.createReminder({
	// 		eveningRemindersUser: {
	// 			connect: {id: user.id},
	// 		},
	// 		postHookId: reminder.postHookId,
	// 		type: 'EVENING_RECAP',
	// 		status: 'PENDING',
	// 		sendingDate: reminder.sendingDate,
	// 	});
	// })

	return res.status(200).send();
};

module.exports = {
	scheduleDailyMails,
};
