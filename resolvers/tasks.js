const {getUserId, createItemOwnerFilter} = require('../utils');

const gql = String.raw;

const TaskWithProjectDeadline = gql`
	fragment TaskWithProjectDeadline on Item {
		id
		name
		type
		unit
		description
		section {
			id
			project {
				deadline
			}
		}
		status
		position
		timeItTook
		dueDate
		createdAt
	}
`;

const tasks = async (root, {filter, sort, projectId}, ctx) => {
	let where;
	const {token} = ctx;

	if (token === process.env.ADMIN_TOKEN && projectId) {
		where = {
			section: {
				project: {
					id: projectId,
				},
			},
		};
	}
	else if (token) {
		where = {
			// types we want to show to the customer
			type_in: [
				'DEFAULT',
				'CUSTOMER',
				'CONTENT_ACQUISITION',
				'CUSTOMER_REMINDER',
				'VALIDATION',
				'USER_REMINDER',
				'INVOICE',
			],
			OR: [
				{linkedCustomer: {token}},
				{
					section: {
						project: {
							OR: [{token}, {customer: {token}}],
						},
					},
				},
			],
		};
	}
	else {
		where = {
			section: projectId && {
				project: {
					id: projectId,
				},
			},
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
				createItemOwnerFilter(getUserId(ctx)),
			],
		};
	}

	const tasks = await ctx.db
		.items({
			where,
			orderBy: sort,
		})
		.$fragment(TaskWithProjectDeadline);

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
};

module.exports = {
	tasks,
};
