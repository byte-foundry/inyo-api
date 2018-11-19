const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeProject = async (parent, {id}, ctx) => {
	const [project] = await ctx.db.projects({
		where: {
			id,
			customer: {
				serviceCompany: {
					owner: {
						id: getUserId(ctx),
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

	return ctx.db.deleteProject({id});
};

module.exports = {
	removeProject,
};
