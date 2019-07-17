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
		},
	});

	return updatedTask;
};

module.exports = {
	removeAssignmentToTask,
};
