const fetch = require('node-fetch');
const moment = require('moment-timezone');

const {prisma} = require('../generated/prisma-client');

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

const createPosthookCallback = async ({path, postAt, data}) => {
	const response = await fetch('https://api.posthook.io/v1/hooks', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': process.env.POSTHOOK_API_KEY,
		},
		body: JSON.stringify({
			path,
			postAt,
			data,
		}),
	});

	switch (response.statusCode) {
	case 400:
	case 401:
	case 413:
	case 429:
	case 500:
		return Promise.reject(response.statusCode);
	default:
		return response.json();
	}
};

const scheduleMorningEmail = async (user, startNextWorkDayAt) => {
	console.log('Scheduling morning email for', user.email);

	const response = await createPosthookCallback({
		path: '/send-day-tasks',
		postAt: startNextWorkDayAt,
		data: {
			userId: user.id,
		},
	});

	return {
		postHookId: response.data.id,
		sendingDate: startNextWorkDayAt,
	};
};

const scheduleEveningEmail = async (user) => {
	const now = new Date();
	const endNextWorkDayAt = new Date(
		`${now.toJSON().split('T')[0]}T${user.endWorkAt.split('T')[1]}`,
	);

	if (now - endNextWorkDayAt > 0) {
		endNextWorkDayAt.setDate(endNextWorkDayAt.getDate() + 1);
	}

	const response = await createPosthookCallback({
		path: '/send-day-recap',
		postAt: endNextWorkDayAt,
		data: {
			userId: user.id,
		},
	});

	return {
		postHookId: response.data.id,
		sendingDate: endNextWorkDayAt,
	};
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

		const reminder = await scheduleMorningEmail(user, startNextWorkDayAt);

		await prisma.createReminder({
			morningRemindersUser: {
				connect: {id: user.id},
			},
			postHookId: reminder.postHookId,
			type: 'MORNING_TASKS',
			status: 'PENDING',
			sendingDate: reminder.sendingDate,
		});
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
