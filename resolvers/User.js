const moment = require('moment');
const {
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');

const gql = String.raw;

const User = {
	id: node => node.id,
	email: node => node.email,
	hmacIntercomId: node => node.hmacIntercomId,
	firstName: node => node.firstName,
	lastName: node => node.lastName,
	customers: (node, args, ctx) => ctx.db
		.user({id: node.id})
		.company()
		.customers(),
	collaborators: (node, args, ctx) => ctx.db.user({id: node.id}).collaborators(),
	collaboratorRequests: (node, args, ctx) => ctx.db.user({id: node.id}).collaboratorRequests(),
	collaborationRequests: (node, args, ctx) => ctx.db.user({id: node.id}).collaborationRequests(),
	assignedTasks: (node, args, ctx) => ctx.db.user({id: node.id}).assignedTasks(),
	projects: async (node, args, ctx) => ctx.db.projects({
		where: {
			NOT: {status: 'REMOVED'},
			OR: [
				{
					owner: {id: node.id},
				},
				{
					customer: {
						serviceCompany: {
							owner: {id: node.id},
						},
					},
				},
			],
		},
	}),
	company: (node, args, ctx) => ctx.db.user({id: node.id}).company(),
	startWorkAt: node => node.startWorkAt && new Date(node.startWorkAt),
	endWorkAt: node => node.endWorkAt && new Date(node.endWorkAt),
	workingDays: node => node.workingDays,
	timeZone: node => node.timeZone,
	defaultDailyPrice: node => node.defaultDailyPrice,
	defaultVatRate: node => node.defaultVatRate,
	workingFields: node => node.workingFields,
	jobType: node => node.jobType,
	interestedFeatures: node => node.interestedFeatures,
	hasUpcomingProject: node => node.hasUpcomingProject,
	tags: (node, args, ctx) => ctx.db.user({id: node.id}).tags(),
	settings: (node, args, ctx) => ctx.db.user({id: node.id}).settings(),
	clientViews: async (node, args, ctx) => {
		const viewEvents = await ctx.db.customerEvents({
			where: {
				customer: {
					serviceCompany: {
						owner: {
							id: node.id,
						},
					},
				},
				type: 'VIEWED_PROJECT',
			},
		});

		const daysVisited = {};

		viewEvents.forEach((event) => {
			const formatedDay = moment(event.createdAt).format('YYYY/MM/DD');

			if (!daysVisited[formatedDay]) {
				daysVisited[formatedDay] = 1;
			}
		});

		return Object.keys(daysVisited).length;
	},
	tasks: async (
		node,
		{
			filter, schedule, sort, first = Infinity, after,
		},
		ctx,
	) => {
		let scheduleFilter = {};

		switch (schedule) {
		case 'UNSCHEDULED':
			scheduleFilter = {
				scheduledFor: null,
				OR: [
					{
						status_not: 'FINISHED',
					},
					{
						status: 'FINISHED'
						finishedAt_gt: moment().tz(ctx.timeZone).startOf('day'),
					},
				]
			};
			break;
		case 'FINISHED_TIME_IT_TOOK_NULL':
			scheduleFilter = {
				status: 'FINISHED',
				timeItTook: null,
				type_in: ['DEFAULT', 'PERSONAL'],
				OR: [
					{
						assignee: null,
					},
					createItemCollaboratorFilter(ctx.userId),
				],
			};
			break;
		case 'SCHEDULED':
			scheduleFilter = {
				scheduledFor_not: null,
			};
			break;
		case 'TO_BE_RESCHEDULED':
			scheduleFilter = {
				scheduledFor_lt: moment().tz(ctx.timeZone).startOf('day'),
				status_not: 'FINISHED',
				type_in: ['DEFAULT', 'PERSONAL'],
				OR: [
					{
						assignee: null,
					},
					createItemCollaboratorFilter(ctx.userId),
				],
			};
			break;
		default:
			break;
		}

		const tasks = await ctx.db.items({
			where: {
				OR: [
					{
						section: null,
					},
					{
						section: {
							project: {
								status_not: 'REMOVED',
							},
						},
					},
				],
				AND: [
					{
						OR: filter
							&& filter.linkedCustomerId && [
							{
								linkedCustomer: {id: filter.linkedCustomerId},
							},
							{
								AND: [
									{
										section: {
											project: {
												customer: {
													id: filter.linkedCustomerId,
												},
											},
										},
									},
									{
										linkedCustomer: null,
									},
								],
							},
						],
					},
					{
						OR: [
							createItemOwnerFilter(node.id),
							createItemCollaboratorFilter(node.id),
						],
					},
					scheduleFilter,
				],
			},
			orderBy: sort,
		}).$fragment(gql`
			fragment TaskWithProjet on Item {
				id
				name
				scheduledFor
				schedulePosition
				type
				unit
				description
				finishedAt
				createdAt
				assignee {
					id
					email
					firstName
					lastName
				}
				section {
					project {
						deadline
					}
				}
				status
				position
				timeItTook
				dueDate
			}
		`);

		if (sort === 'dueDate_ASC') {
			return tasks.sort(
				(a, b) => new Date(a.dueDate) - new Date(b.dueDate)
					|| new Date(a.section.project.deadline)
						- new Date(b.section.project.deadline),
			);
		}
		if (sort === 'dueDate_DESC') {
			return tasks.sort(
				(a, b) => new Date(b.dueDate) - new Date(a.dueDate)
					|| new Date(b.section.project.deadline)
						- new Date(a.section.project.deadline),
			);
		}

		let index = 0;

		if (after) {
			index = tasks.findIndex(t => t.id === after);

			if (index < 0) index = 0;
		}

		return tasks.slice(index, first);
	},
	schedule: (node, {start = '', first = 7}, ctx) => {
		if (typeof first !== 'number' || first <= 0) {
			first = 7; // eslint-disable-line no-param-reassign
		}

		let startDate = moment.tz(start, ctx.timeZone);

		if (!startDate.isValid()) {
			startDate = moment().tz(ctx.timeZone);
		}

		return new Array(first).fill({}).map((_, index) => ({
			date: startDate
				.clone()
				.add(index, 'days')
				.format(moment.HTML5_FMT.DATE),
		}));
	},
	focusedTasks: async (node, args, ctx) => ctx.db.user({id: node.id}).focusedTasks(),
	notifications: async (node, {from}, ctx) => ctx.db.user({id: node.id}).notifications({
		where: {
			createdAt_lt: from,
		},
		first: 20,
		orderBy: 'createdAt_DESC',
	}),
	signedUpAt: node => node.createdAt,
	lifetimePayment: node => node.lifetimePayment,
};

module.exports = {
	User,
};
