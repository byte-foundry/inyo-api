const moment = require('moment-timezone');

const {createItemOwnerFilter} = require('../utils');

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

const reminders = async (root, args, ctx) => {
	const taskReminders = await ctx.db.reminders({
		where: {
			type_in: [
				'DELAY',
				'FIRST',
				'SECOND',
				'LAST',
				'INVOICE_DELAY',
				'INVOICE_FIRST',
				'INVOICE_SECOND',
				'INVOICE_THIRD',
				'INVOICE_FOURTH',
				'INVOICE_LAST',
				'CONTENT_ACQUISITION_DELAY',
				'CONTENT_ACQUISITION_FIRST',
				'CONTENT_ACQUISITION_SECOND',
			],
			item: {
				AND: [
					createItemOwnerFilter(ctx.userId),
					{
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
				],
			},
			sendingDate_gt: new Date(),
		},
	});

	const {
		startWorkAt,
		endWorkAt,
		workingDays,
		timeZone,
		eveningReminders: [eveningReminder],
	} = await ctx.db.user({
		id: ctx.userId,
	}).$fragment(gql`
		fragment WorkHoursUser on User {
			startWorkAt
			endWorkAt
			workingDays
			timeZone
			eveningReminders(where: {sendingDate_gt: "${
	new Date().toJSON().split('T')[0]
}"}) {
				id
				type
				metadata
				sendingDate
				status
			}
		}
	`);

	const now = new Date();
	const startedWorkAt = new Date(
		`${now.toJSON().split('T')[0]}T${startWorkAt.split('T')[1]}`,
	);

	if (now - startedWorkAt < 0) {
		startedWorkAt.setDate(startedWorkAt.getDate() - 1);
	}

	const dayNumber = moment(startedWorkAt)
		.tz(timeZone || 'Europe/Paris')
		.day();

	// the user is not working today, no reports
	if (!workingDays.includes(weekDays[dayNumber])) {
		return taskReminders;
	}

	const willEndWorkAt = new Date(
		`${now.toJSON().split('T')[0]}T${endWorkAt.split('T')[1]}`,
	);

	if (now - willEndWorkAt > 0) {
		willEndWorkAt.setDate(willEndWorkAt.getDate() + 1);
	}

	const customerReports = (await ctx.db.customers({
		where: {
			serviceCompany: {owner: {id: ctx.userId}},
			OR: [
				{
					projects_some: {
						status_in: ['ONGOING', 'ARCHIVED'],
						notifyActivityToCustomer: true,
						sections_some: {
							items_some: {
								type_in: ['DEFAULT'],
								status: 'FINISHED',
								finishedAt_gte: startedWorkAt.toJSON(),
							},
						},
					},
				},
				{
					linkedTasks_some: {
						type_in: ['DEFAULT'],
						status: 'FINISHED',
						finishedAt_gte: startedWorkAt.toJSON(),
					},
				},
			],
		},
	})).map(customer => ({
		id: `${customer.id}_report`,
		type: 'CUSTOMER_REPORT',
		customer,
		status:
			eveningReminder
			&& eveningReminder.metadata.canceledReports
			&& eveningReminder.metadata.canceledReports[customer.id]
				? 'CANCELED'
				: 'PENDING',
		sendingDate: eveningReminder
			? eveningReminder.sendingDate
			: willEndWorkAt.toJSON(),
	}));

	const remindersAndReports = [...taskReminders, ...customerReports];

	remindersAndReports.sort((a, b) => (b.sendingDate < a.sendingDate ? -1 : 1));

	return remindersAndReports;
};

module.exports = {
	reminders,
};
