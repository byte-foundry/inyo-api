const moment = require('moment-timezone');

const {
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');

const ScheduleDay = {
	date: node => node.date,
	tasks: (node, args, ctx) => ctx.db.items({
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
			scheduledFor: node.date,
		},
		orderBy: 'schedulePosition_ASC',
	}),
	reminders: (node, args, ctx) => ctx.db.reminders({
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
						OR: [
							createItemOwnerFilter(ctx.userId),
							createItemCollaboratorFilter(ctx.userId),
						],
					},
				],
				sendingDate: node.date,
			},
		},
	}),
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
				AND: [
					{
						OR: [
							{
								section: null,
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
