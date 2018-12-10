const fetch = require('node-fetch');

const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

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

const scheduleMorningEmail = async (user) => {
	console.log('Scheduling morning email for', user.email);

	const now = new Date();
	const startNextWorkDayAt = new Date(
		`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
	);

	if (now - startNextWorkDayAt > 0) {
		startNextWorkDayAt.setDate(startNextWorkDayAt.getDate() + 1);
	}

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
			startWorkAt
		}
	`);

	morningUsers.forEach(async (user) => {
		const reminder = await scheduleMorningEmail(user);

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
