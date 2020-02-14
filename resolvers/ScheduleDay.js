const moment = require('moment-timezone');

const gql = String.raw;

const {
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');

const ReminderWithItem = gql`
	fragment TaskWithProjet on Reminder {
		id
		type
		sendingDate
		status
		item {
			id
		}
	}
`;

const TaskWithProject = gql`
	fragment TaskWithProject on Item {
		id
		scheduledFor
		schedulePosition
		scheduledForDays {
			date
			position
		}
		name
		type
		description
		unit
		status
		reviewer
		finishedAt
		position
		dailyRate
		dueDate
		createdAt
		updatedAt
		timeItTook
		tags {
			id
		}
		owner {
			id
		}
		attachments {
			id
		}
		comments {
			id
		}
		reminders(
			where: {
				type_in: [
					DELAY
					FIRST
					SECOND
					LAST
					INVOICE_DELAY
					INVOICE_FIRST
					INVOICE_SECOND
					INVOICE_THIRD
					INVOICE_FOURTH
					INVOICE_LAST
					CONTENT_ACQUISITION_DELAY
					CONTENT_ACQUISITION_FIRST
					CONTENT_ACQUISITION_SECOND
				]
			}
		) {
			id
		}
		assignee {
			id
		}
		section {
			id
		}
	}
`;

const ScheduleDay = {
	date: node => node.date,
	tasks: async (node, args, ctx) => {
		const tasks = await ctx.db
			.items({
				where: {
					AND: [
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
						{
							OR: [
								createItemOwnerFilter(ctx.userId),
								createItemCollaboratorFilter(ctx.userId),
							],
						},
					],
					type_in: ['DEFAULT', 'PERSONAL'],
					OR: [
						{
							scheduledForDays_some: {
								date: node.date,
							},
						},
						{
							status: 'FINISHED',
							scheduledForDays_none: {},
							AND: [
								{
									finishedAt_lt: moment()
										.tz(ctx.timeZone)
										.startOf('day'),
								},
								{
									finishedAt_gt: moment(node.date)
										.tz(ctx.timeZone)
										.startOf('day'),
									finishedAt_lt: moment(node.date)
										.tz(ctx.timeZone)
										.endOf('day'),
								},
							],
						},
					],
				},
			})
			.$fragment(TaskWithProject);

		tasks.sort((a, b) => {
			const aDay = a.scheduledForDays.find(
				day => day.date.split('T')[0] === node.date,
			);
			const bDay = b.scheduledForDays.find(
				day => day.date.split('T')[0] === node.date,
			);

			if (!aDay) return 1;
			if (!bDay) return -1;

			return aDay.position - bDay.position;
		});

		return tasks;
	},
	reminders: (node, args, ctx) => ctx.db
		.reminders({
			where: {
				item: {
					AND: [
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
						{
							OR: [createItemOwnerFilter(ctx.userId)],
						},
					],
				},
				status_not: 'CANCELED',
				sendingDate_gt: moment(node.date)
					.tz(ctx.timeZone)
					.startOf('day')
					.toISOString(),
				sendingDate_lt: moment(node.date)
					.tz(ctx.timeZone)
					.endOf('day')
					.toISOString(),
			},
		})
		.$fragment(ReminderWithItem),
	deadlines: async (node, args, ctx) => {
		const projects = await ctx.db.projects({
			where: {
				owner: {id: ctx.userId},
				status: 'ONGOING',
				deadline_gt: moment(node.date)
					.tz(ctx.timeZone)
					.startOf('day')
					.toISOString(),
				deadline_lt: moment(node.date)
					.tz(ctx.timeZone)
					.endOf('day')
					.toISOString(),
			},
			orderBy: 'deadline_ASC',
		});
		const items = await ctx.db.items({
			where: {
				OR: [
					createItemOwnerFilter(ctx.userId),
					createItemCollaboratorFilter(ctx.userId),
				],
				dueDate_gt: moment(node.date)
					.tz(ctx.timeZone)
					.startOf('day')
					.toISOString(),
				dueDate_lt: moment(node.date)
					.tz(ctx.timeZone)
					.endOf('day')
					.toISOString(),
			},
			orderBy: 'dueDate_ASC',
		});

		const deadlines = [...projects, ...items];

		deadlines.sort(
			(a, b) => new Date(a.dueDate || a.deadline) - new Date(b.dueDate || b.deadline),
		);

		return deadlines;
	},
};

module.exports = {
	ScheduleDay,
};
