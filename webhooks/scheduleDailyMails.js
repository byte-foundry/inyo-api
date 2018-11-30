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
	const now = new Date();
	const startNextWorkDayAt = new Date(
		now.toJSON().split('T')[0] + user.startWorkAt,
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
		now.toJSON().split('T')[0] + user.endWorkAt,
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
	// checking to whom we can send a morning/evening mail
	const users = await prisma.users({
		where: {
			OR: [
				{
					startWorkAt_not: null,
					morningReminders_every: {
						status_not: 'PENDING',
					},
				},
				{
					endWorkAt_not: null,
					eveningReminders_every: {
						status_not: 'PENDING',
					},
				},
			],
		},
	}).$fragment(gql`
		fragment WorkingUser on User {
			id
			startWorkAt
			endWorkAt
		}
	`);

	users.forEach(async (user) => {
		if (user.startWorkAt) {
			const reminder = await scheduleMorningEmail(user);

			await prisma.createReminder({
				morningReminderUser: {
					connect: {id: user.id},
				},
				postHookId: reminder.postHookId,
				type: 'MORNING_TASKS',
				status: 'PENDING',
				sendingDate: reminder.sendingDate,
			});
		}
		if (user.endWorkAt) {
			const reminder = await scheduleEveningEmail(user);

			await prisma.createReminder({
				eveningMorningUser: {
					connect: {id: user.id},
				},
				postHookId: reminder.postHookId,
				type: 'EVENING_RECAP',
				status: 'PENDING',
				sendingDate: reminder.sendingDate,
			});
		}
	});
};

module.exports = {
	scheduleDailyMails,
};
