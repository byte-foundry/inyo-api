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
			collabLinkToProject {
				id
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${projectId} does not exist`);
	}

	if (!project.collabLinkToProject.every(c => c.id !== collaboratorId)) {
		throw new AlreadyExistingError(
			`Collaborator ${collaboratorId} is already linked to project`,
		);
	}

	const updatedProject = await ctx.db.updateProject({
		where: {
			id: projectId,
		},
		data: {
			collabLinkToProject: {connect: {id: collaboratorId}},
		},
	});
};

module.exports = {
	linkToProject,
};
