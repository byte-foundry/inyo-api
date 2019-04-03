const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeProject = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [project] = await ctx.db.projects({
		where: {
			id,
			customer: {
				serviceCompany: {
					owner: {
						id: userId,
					},
				},
			},
		},
	});

	if (!project) {
		throw new NotFoundError(`Project '${id}' has not been found.`);
	}

	if (project.status !== 'DRAFT') {
		throw new Error('Deleting an ongoing project is not possible');
	}

	const removedProject = ctx.db.deleteProject({id});

	await ctx.db.createUserEvent({
		type: 'REMOVED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: removedProject.id,
		},
	});

	return removedProject;
};

module.exports = {
	removeProject,
};
