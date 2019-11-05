const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');

const linkToProject = async (parent, {projectId, collaboratorId}, ctx) => {
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
			linkedCollaborators {
				id
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${projectId} does not exist`);
	}

	if (!project.linkedCollaborators.every(c => c.id !== collaboratorId)) {
		throw new AlreadyExistingError(
			`Collaborator ${collaboratorId} is already linked to project`,
		);
	}

	const updatedProject = ctx.db.updateProject({
		where: {
			id: projectId,
		},
		data: {
			linkedCollaborators: {connect: {id: collaboratorId}},
		},
	});

	await ctx.db.createUserEvent({
		type: 'LINKED_COLLABORATOR_TO_PROJECT',
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
	linkToProject,
};
