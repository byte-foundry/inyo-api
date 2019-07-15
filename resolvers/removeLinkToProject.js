const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');

const removeLinkToProject = async (
	parent,
	{projectId, collaboratorId},
	ctx,
) => {
	const [collaborator] = await ctx.db.users({
		where: {
			id: collaboratorId,
			collaborators_some: {
				id: getUserId(ctx),
			},
		},
	});

	if (!collaborator) {
		throw new NotFoundError(`Collaborator ${collaboratorId} does not exist`);
	}

	const project = await ctx.db.project({
		id: projectId,
	}).$fragment(gql`
		fragment CollabProject on Project {
			id
			collabLinkToProject {
				id
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${projectId} does not exist`);
	}

	if (!project.collabLinkToProject.some(c => c.id === collaboratorId)) {
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
			},
		});
	});

	const updatedProject = await ctx.db.updateProject({
		where: {
			id: projectId,
		},
		data: {
			collabLinkToProject: {disconnect: {id: collaboratorId}},
		},
	});
};

module.exports = {
	removeLinkToProject,
};
