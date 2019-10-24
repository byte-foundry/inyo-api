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
			user: {
				id: ctx.userId,
			},
			type_in: [
				// 'FOCUSED_TASK',
				// 'UNFOCUSED_TASK',
				'CANCELED_REMINDER',
				'ADDED_TASK',
				'UPDATED_TASK',
				'FINISHED_TASK',
				'UNFINISHED_TASK',
				// 'REMOVED_TASK',
				'CREATED_PROJECT',
				'UPDATED_PROJECT',
				'ARCHIVED_PROJECT',
				'UNARCHIVED_PROJECT',
				// 'REMOVED_PROJECT',
				// 'CREATED_CUSTOMER',
				// 'UPDATED_CUSTOMER',
				// 'REMOVED_CUSTOMER',
				'POSTED_COMMENT',
				'ADDED_SECTION',
				'UPDATED_SECTION',
				// 'REMOVED_SECTION',
				// 'UPLOADED_ATTACHMENT',
				// 'COLLAB_ASKED',
				// 'COLLAB_REQUESTED',
				// 'COLLAB_ACCEPTED',
				// 'COLLAB_REJECTED',
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
