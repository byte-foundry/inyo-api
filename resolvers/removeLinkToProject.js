const gql = String.raw;

const {NotFoundError} = require('../errors');

const removeLinkToProject = async (
	parent,
	{projectId, collaboratorId},
	ctx,
) => {
	const project = await ctx.db.project({
		id: projectId,
	}).$fragment(gql`
		fragment CollabProject on Project {
			id
			linkedCollaborators {
				id
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${projectId} does not exist`);
	}

	if (!project.linkedCollaborators.some(c => c.id === collaboratorId)) {
		throw new NotFoundError(
			`Collaborator ${collaboratorId} is not linked to project`,
		);
	}

	// remove all assignedTasks
	const tasks = await ctx.db.items({
		where: {
			section: {
				project: {
					id: project.id,
				},
			},
			assignee: {
				id: collaboratorId,
			},
		},
	});

	tasks.forEach(async (t) => {
		await ctx.db.updateItem({
			where: {id: t.id},
			data: {
				assignee: {disconnect: true},
				scheduledFor: null,
				schedulePosition: null,
				scheduledForDays: {
					deleteMany: {},
				},
			},
		});
	});

	const updatedProject = ctx.db.updateProject({
		where: {
			id: projectId,
		},
		data: {
			linkedCollaborators: {disconnect: {id: collaboratorId}},
		},
	});

	await ctx.db.createUserEvent({
		type: 'UNLINKED_COLLABORATOR_TO_PROJECT',
		user: {connect: {id: ctx.userId}},
		metadata: {
			id: projectId,
		},
		project: {connect: {id: projectId}},
		collaborator: {connect: {id: collaboratorId}},
	});

	return updatedProject;
};

module.exports = {
	removeLinkToProject,
};
