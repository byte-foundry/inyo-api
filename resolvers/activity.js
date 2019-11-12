const activity = async (root, {projectId}, ctx) => {
	const projectFilter = {
		OR: [
			{
				project: {id: projectId},
			},
			{
				section: {
					project: {id: projectId},
				},
			},
			{
				task: {
					section: {
						project: {id: projectId},
					},
				},
			},
			{
				comment: {
					item: {
						section: {
							project: {id: projectId},
						},
					},
				},
			},
			{
				reminder: {
					item: {
						section: {
							project: {id: projectId},
						},
					},
				},
			},
			{
				collaborator: {
					assignedTasks_some: {
						section: {
							project: {id: projectId},
						},
					},
				},
			},
			{
				collaborator: {
					assignedTasks_some: {
						section: {
							project: {id: projectId},
						},
					},
				},
			},
		],
	};

	const userEvents = await ctx.db.userEvents({
		where: {
			OR: [
				{
					user: {
						id: ctx.userId,
					},
				},
				{
					OR: [
						{
							project: {
								owner: {
									id: ctx.userId,
								},
							},
						},
						{
							task: {
								owner: {
									id: ctx.userId,
								},
							},
						},
					],
				},
			],
			type_in: [
				'FOCUSED_TASK',
				'UNFOCUSED_TASK',
				'SENT_REMINDER',
				'CANCELED_REMINDER',
				'ADDED_TASK',
				'UPDATED_TASK',
				'FINISHED_TASK',
				'UNFINISHED_TASK',
				'REMOVED_TASK',
				'CREATED_PROJECT',
				'UPDATED_PROJECT',
				'ARCHIVED_PROJECT',
				'UNARCHIVED_PROJECT',
				'REMOVED_PROJECT',
				'POSTED_COMMENT',
				'ADDED_SECTION',
				'UPDATED_SECTION',
				'REMOVED_SECTION',
				'UPLOADED_ATTACHMENT',
				'REMOVED_ATTACHMENT',
				'LINKED_CUSTOMER_TO_TASK',
				'UNLINKED_CUSTOMER_TO_TASK',
				'LINKED_CUSTOMER_TO_PROJECT',
				'UNLINKED_CUSTOMER_TO_PROJECT',
				'LINKED_COLLABORATOR_TO_PROJECT',
				'UNLINKED_COLLABORATOR_TO_PROJECT',
				'ASSIGNED_TO_TASK',
				'REMOVE_ASSIGNMENT_TO_TASK',
			],
			AND: projectId ? [projectFilter] : undefined,
		},
		orderBy: 'createdAt_ASC',
	});
	const customersEvents = await ctx.db.customerEvents({
		where: {
			customer: {
				serviceCompany: {
					owner: {id: ctx.userId},
				},
			},
			type_in: [
				'VIEWED_PROJECT',
				'POSTED_COMMENT',
				'UPLOADED_ATTACHMENT',
				'FINISHED_TASK',
			],
			AND: projectId
				? [
					{
						OR: [
							{
								project: {id: projectId},
							},
							{
								task: {
									section: {
										project: {id: projectId},
									},
								},
							},
							{
								comment: {
									item: {
										section: {
											project: {id: projectId},
										},
									},
								},
							},
						],
					},
				  ]
				: undefined,
		},
		orderBy: 'createdAt_ASC',
	});

	const events = [...customersEvents, ...userEvents];

	events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

	return events;
};

module.exports = {
	activity,
};
