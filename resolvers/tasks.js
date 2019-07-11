const {getUserId, createItemOwnerFilter} = require('../utils');

const gql = String.raw;

const tasks = async (root, {
	token, filter, sort, projectId,
}, ctx) => {
	let where;

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

	const tasks = await ctx.db.items({
		where,
		orderBy: sort,
	}).$fragment(gql`
		fragment TaskWithProjet on Item {
			id
			name
			type
			unit
			description
			section {
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
};

module.exports = {
	tasks,
};
