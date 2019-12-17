const moment = require('moment');
const glouton = require('glouton');
const IntercomClient = require('intercom-client').Client;
const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

const intercom = new IntercomClient({token: process.env.INTERCOM_TOKEN});

const updateIntercomUser = glouton(
	(...args) => intercom.users.update(...args),
	{
		concurrency: 100,
		validateResponse: (r) => {
			if (r.statusCode !== 200) {
				// TODO: postpone until limit end
				console.log(r.headers);
				return 10000;
			}

			return true;
		},
	},
);

const updateIntercom = async (req, res) => {
	console.log('Updating intercom active stats');

	let sessionsDayFragments = '';

	for (let index = 6; index >= 0; index--) {
		sessionsDayFragments += gql`
			day${index}: userEvents(where: {
				type: ME_CALL
				createdAt_gt: "${moment()
		.subtract(index + 1, 'days')
		.format()}"
				createdAt_lt: "${moment()
		.subtract(index, 'days')
		.format()}"
			}, first: 1) {
				createdAt
			}

			dayActive${index}: userEvents(where: {
				type_in: [
					FOCUSED_TASK
					UNFOCUSED_TASK
					CANCELED_REMINDER
					ADDED_TASK
					UPDATED_TASK
					REMOVED_TASK
					FINISHED_TASK
					UNFINISHED_TASK
					CREATED_PROJECT
					UPDATED_PROJECT
					ARCHIVED_PROJECT
					UNARCHIVED_PROJECT
					REMOVED_PROJECT
					CREATED_CUSTOMER
					UPDATED_CUSTOMER
					REMOVED_CUSTOMER
					POSTED_COMMENT
					ADDED_SECTION
					UPDATED_SECTION
					REMOVED_SECTION
					UPLOADED_ATTACHMENT
					REMOVED_ATTACHMENT
					COLLAB_ASKED
					COLLAB_REQUESTED
					COLLAB_ACCEPTED
					COLLAB_REJECTED
					LINKED_CUSTOMER_TO_TASK
					UNLINKED_CUSTOMER_TO_TASK
					LINKED_CUSTOMER_TO_PROJECT
					UNLINKED_CUSTOMER_TO_PROJECT
					LINKED_COLLABORATOR_TO_PROJECT
					UNLINKED_COLLABORATOR_TO_PROJECT
					LINKED_TO_PROJECT
					ASSIGNED_TO_TASK
					REMOVE_ASSIGNMENT_TO_TASK
				]
				createdAt_gt: "${moment()
		.subtract(index + 1, 'days')
		.format()}"
				createdAt_lt: "${moment()
		.subtract(index, 'days')
		.format()}"
			}, first: 1) {
				createdAt
			}

			finishedTasksEvents: userEvents(where: {
				type_in: FINISHED_TASK
				createdAt_gt: "${moment()
		.subtract(7, 'days')
		.format()}"
			}) {
				createdAt
			}

			createdProjectsEvents: userEvents(where: {
				type_in: CREATED_PROJECT
				createdAt_gt: "${moment()
		.subtract(30, 'days')
		.format()}"
			}) {
				createdAt
			}

			createdTasksEvents: userEvents(where: {
				type_in: ADDED_TASK
				createdAt_gt: "${moment()
		.subtract(30, 'days')
		.format()}"
			}) {
				createdAt
			}

			projects(where: {customer: {customerEvents_some: {createdAt_gt: "${moment()
		.subtract(15, 'days')
		.format()}"}}}) {
				customer {
					customerEvents(where: {createdAt_gt: "${moment()
		.subtract(15, 'days')
		.format()}"}) {
						createdAt
					},
				},
			},
		`;
	}

	const users = await prisma.users({
		where: {
			OR: [
				{
					userEvents_some: {
						OR: [
							{
								createdAt_gt: moment()
									.subtract(8, 'days')
									.format(),
							},
							{
								type_in: 'CREATED_PROJECT',
								createdAt_gt: moment()
									.subtract(31, 'days')
									.format(),
							},
						],
					},
				},
				{
					projects_some: {
						customer: {
							customerEvents_some: {
								createdAt_gt: moment()
									.subtract(16, 'days')
									.format(),
							},
						},
					},
				},
			],
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			id
			email
			company {
				customers {
					id
				}
			}
			${sessionsDayFragments}
		}
	`);

	console.log(users.length, 'users to update');

	await Promise.all(
		users.map((user) => {
			const sessions = [];
			const activeSessions = [];

			for (let index = 6; index >= 0; index--) {
				sessions.push(...user[`day${index}`]);
				activeSessions.push(...user[`dayActive${index}`]);
			}

			const sessionsCount = sessions.length;
			const activeSessionsCount = activeSessions.length;
			const finishedTasksEventsCount = user.finishedTasksEvents.length;
			const createdProjectsEventsCount = user.createdProjectsEvents.length;
			const createdTasksEventsCount = user.createdTasksEvents.length;
			const customerProjectViewsCount = user.projects.reduce(
				(sum, project) => sum + project.customer.customerEvents.length,
				0,
			);

			return updateIntercomUser({
				user_id: user.id,
				email: user.email,
				custom_attributes: {
					'visit-days-last-7-days': sessionsCount,
					'active-days-last-7-days': activeSessionsCount,
					'tasks-finished-last-7-days': finishedTasksEventsCount,
					'projects-created-last-30-days': createdProjectsEventsCount,
					'tasks-created-last-30-days': createdTasksEventsCount,
					'customer-project-views-last-15-days': customerProjectViewsCount,
					'customers-count': user.company.customers.length,
				},
			});
		}),
	).catch((e) => {
		console.error('Error updating intercom values', e.body);
	});

	console.log('Updating intercom active stats');
	res.status(200).send();
};

module.exports = {
	updateIntercom,
};
