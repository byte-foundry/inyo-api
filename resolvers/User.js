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
	tasks: async (node, {filter, sort}, ctx) => {
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
				],
				orderBy: sort,
			},
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

		return tasks;
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
