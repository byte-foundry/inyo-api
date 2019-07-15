const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');

const assignToTask = async (parent, {taskId, collaboratorId}, ctx) => {
	const [user] = await ctx.db.users({
		where: {
			id: collaboratorId,
			collaborators_some: {
				id: getUserId(ctx),
			},
		},
	});

	if (!user) {
		throw new NotFoundError(`Collaborator ${collaboratorId} does not exist`);
	}

	const [task] = await ctx.db.items({
		where: {
			id: taskId,
			section: {
				project: {
					collabLinkToProject_some: {
						id: collaboratorId,
					},
				},
			},
		},
	}).$fragment(gql`
		fragment TaskCollaborators on Item {
			id
			assignee {
				id
			}
		}
	`);

	if (!task) {
		throw new NotFoundError(
			`Collaborator ${collaboratorId} is not linked to project of task ${taskId}`,
		);
	}

	if (task.assignee.id === collaboratorId) {
		throw new AlreadyExistingError(
			`Collaborator ${collaboratorId} is already assigned to task ${taskId}`,
		);
	}

	const updatedTask = await ctx.db.updateItem({
		where: {
			id: taskId,
		},
		data: {
			assignee: {connect: {id: collaboratorId}},
		},
	});

	const assignedToTaskEvent = await ctx.db.createUserEvent({
		type: 'ASSIGNED_TO_TASKED',
		user: {connect: {id: getUserId(ctx)}},
		metadata: {
			assignedId: collaboratorId,
			task: taskId,
		},
	});

	await ctx.db.createNotification({
		userEvent: {connect: {id: assignedToTaskEvent.id}},
		user: {connect: {id: collaboratorId}},
	});

	return task;
};

module.exports = {
	assignToTask,
};
