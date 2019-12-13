const moment = require('moment-timezone');

const {prisma} = require('../generated/prisma-client');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');
const {scheduleEveningEmail} = require('../reminders/scheduleEveningEmail');

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

const scheduleDeadlineApproachingMail = async (user, startNextWorkDayAt) => {
	console.log('Scheduling approaching deadline mail for', user.email);

	return createPosthookReminder({
		type: 'DEADLINE_APPROACHING',
		postAt: startNextWorkDayAt,
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

	// potential deadline email users
	const deadlineUsers = await prisma.users({
		where: {
			// didn't come since the last 2 days or more
			userEvents_none: {
				createdAt_gt: moment().subtract(2, 'days'),
			},
			OR: [
				{
					tasks_some: {
						dueDate_lt: moment().add(1, 'days'),
						dueDate_gt: moment(),
					},
				},
				{
					projects_some: {
						deadline_lt: moment().add(1, 'days'),
						deadline_gt: moment(),
					},
				},
			],
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			email
			timeZone
			startWorkAt
		}
	`);

	deadlineUsers.forEach((user) => {
		const now = new Date();
		const startNextWorkDayAt = new Date(
			`${now.toJSON().split('T')[0]}T${user.startWorkAt.split('T')[1]}`,
		);

		if (startNextWorkDayAt < now) {
			startNextWorkDayAt.setDate(startNextWorkDayAt.getDate() + 1);
		}

		scheduleDeadlineApproachingMail(user, startNextWorkDayAt);
	});

	return res.status(200).send();
};

module.exports = {
	scheduleDailyMails,
};
