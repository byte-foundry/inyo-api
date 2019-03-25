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

const scheduleResetFocus = async (user, resetFocusAt) => {
	console.log('Scheduling reset focus for', user.email);

	return createPosthookReminder({
		type: 'RESET_FOCUSED_TASKS',
		postAt: resetFocusAt,
		user: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
	});
};

const scheduleSlippingAwayMail = async (user, startNextWorkDayAt) => {
	console.log('Scheduling slipping away mail for', user.email);

	return createPosthookReminder({
		type: 'SLIPPING_AWAY',
		postAt: startNextWorkDayAt,
		user: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
	});
};

const scheduleDeadlineApproachingMail = async (user, startNextWorkDayAt) => {
	console.log('Scheduling approaching deadline mail for', user.email);

	return createPosthookReminder({
		type: 'DEADLINE_APPROACHING',
		postAt: startNextWorkDayAt,
		deadlineApproachingUser: {
			connect: {id: user.id},
		},
		data: {
			userId: user.id,
		},
	});
};

const scheduleEveningEmail = async (user, endNextWorkDayAt) => {
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
	});
};

const scheduleDailyMails = async (req, res) => {
	console.log('Scheduling daily mails');

	// checking to whom we have to reset the focus tasks
	const focusedUsers = await prisma.users({
		where: {
			startWorkAt_not: null,
			endWorkAt_not: null,
			OR: [
				{
					resetFocusReminders_some: {},
					resetFocusReminders_every: {
						sendingDate_lt: new Date().toJSON(),
					},
				},
				{
					resetFocusReminders_none: {},
				},
			],
		},
	}).$fragment(gql`
		fragment FocusedUser on User {
			id
			email
			endWorkAt
			timeZone
			workingDays
		}
	`);

	focusedUsers.forEach(async (user) => {
		const now = new Date();
		const startNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
		);
		const endNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.endWorkAt.split('T')[1]}`,
		);

		if (endNextWorkDayAt - startNextWorkDayAt > 0) {
			endNextWorkDayAt.setDate(endNextWorkDayAt.getDate() + 1);
		}

		const oneThirdBeforeNextStart = moment(startNextWorkDayAt)
			.add((endNextWorkDayAt - startNextWorkDayAt) / 3, 'ms')
			.toDate();

		if (now > oneThirdBeforeNextStart) {
			oneThirdBeforeNextStart.setDate(oneThirdBeforeNextStart.getDate() + 1);
		}

		const dayNumber = moment(startNextWorkDayAt)
			.tz(user.timeZone || 'Europe/Paris')
			.day();

		// don't schedule a reset if it's not a worked day
		if (!user.workingDays.includes(weekDays[dayNumber])) {
			return;
		}

		await scheduleResetFocus(user, oneThirdBeforeNextStart);
	});

	// checking to whom we can send an evening mail
	const eveningUsers = await prisma.users({
		where: {
			endWorkAt_not: null,
			OR: [
				{
					eveningReminders_some: {},
					eveningReminders_every: {
						sendingDate_lt: new Date().toJSON(),
					},
				},
				{
					eveningReminders_none: {},
				},
			],
		},
	}).$fragment(gql`
		fragment EveningWorkingUser on User {
			id
			email
			endWorkAt
			timeZone
			workingDays
		}
	`);

	eveningUsers.forEach(async (user) => {
		const now = new Date();
		const endNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.endWorkAt.split('T')[1]}`,
		);

		if (now - endNextWorkDayAt > 0) {
			endNextWorkDayAt.setDate(endNextWorkDayAt.getDate() + 1);
		}

		const dayNumber = moment(endNextWorkDayAt)
			.tz(user.timeZone || 'Europe/Paris')
			.day();

		// don't schedule an email if it's not a worked day
		if (!user.workingDays.includes(weekDays[dayNumber])) {
			return;
		}

		await scheduleEveningEmail(user, endNextWorkDayAt);
	});

	const slippingAwayUsers = await prisma.users({
		where: {
			// didn't come since the last 3 days
			userEvents_none: {
				createdAt_gt: moment()
					.subtract(3, 'days')
					.format(),
			},
			// but came just before (to avoid spamming them everyday)
			userEvents_some: {
				createdAt_gt: moment()
					.subtract(4, 'days')
					.format(),
			},
			startWorkAt_not: null,
			reminders_none: {
				type: 'SLIPPING_AWAY',
				OR: [
					{
						sendingDate_gt: new Date().toJSON(),
					},
					{
						sendingDate_lt: moment().subtract(3, 'days'),
					},
				],
			},
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			id
			email
			startWorkAt
			timeZone
			workingDays
		}
	`);

	// potential deadline email users
	const deadlineUsers = await prisma.users({
		where: {
			// didn't come since the last 2 days or more
			userEvents_none: {
				createdAt_gt: moment()
					.subtract(2, 'days')
					.format(),
			},
			OR: [
				{
					tasks_some: {
						dueDate_gt: moment(),
					},
				},
				{
					projects: {
						deadline_gt: moment(),
					},
				},
			],
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			email
		}
	`);

	// retention email is more important
	deadlineUsers
		.filter(user => !slippingAwayUsers.find(u => u.id === user.id))
		.forEach(user => scheduleDeadlineApproachingMail(user));

	slippingAwayUsers.forEach((user) => {
		const now = new Date();
		const startNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
		);

		if (startNextWorkDayAt < now) {
			startNextWorkDayAt.setDate(startNextWorkDayAt.getDate() + 1);
		}

		const dayNumber = moment(startNextWorkDayAt)
			.tz(user.timeZone || 'Europe/Paris')
			.day();

		let daysToAdd = 0;

		// schedule an email the following worked day or today if there's no working days
		if (user.workingDays.length) {
			while (
				!user.workingDays.includes(weekDays[(dayNumber + daysToAdd) % 7])
			) {
				daysToAdd++;
			}
		}

		startNextWorkDayAt.setDate(startNextWorkDayAt.getDate() + daysToAdd);

		scheduleSlippingAwayMail(user, startNextWorkDayAt);
	});

	return res.status(200).send();
};

module.exports = {
	scheduleDailyMails,
};
