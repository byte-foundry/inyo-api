const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeAssignmentToTask = async (
	parent,
	{taskId, collaboratorId},
	ctx,
) => {
	const [task] = await ctx.db.items({
		where: {
			id: taskId,
			assignee: {
				id: collaboratorId,
			},
		},
	});

	if (!task) {
		throw new NotFoundError(
			`Collaborator ${collaboratorId} is not assigned to task ${taskId}`,
		);
	}

	const updatedTask = await ctx.db.updateItem({
		where: {
			id: taskId,
		},
		data: {
			assignee: {disconnect: true},
			scheduledFor: null,
			schedulePosition: null,
			scheduledForDays: {
				deleteMany: {},
			},
		},
	});

	await ctx.db.createUserEvent({
		type: 'REMOVE_ASSIGNMENT_TO_TASK',
		user: {connect: {id: getUserId(ctx)}},
		metadata: {
			itemId: taskId,
		},
		notifications: {
			create: {
				user: {connect: {id: collaboratorId}},
			},
		},
		collaborator: {
			connect: {id: collaboratorId},
		},
		task: {
			connect: {id: taskId},
		},
	});

	return updatedTask;
};

module.exports = {
	removeAssignmentToTask,
};
