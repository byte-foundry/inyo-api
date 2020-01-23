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
					linkedCollaborators_some: {
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

	if (task.assignee && task.assignee.id === collaboratorId) {
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
			scheduledFor: null,
			schedulePosition: null,
			scheduledForDays: {
				deleteMany: {},
			},
		},
	});

	await ctx.db.createUserEvent({
		type: 'ASSIGNED_TO_TASK',
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
	assignToTask,
};
