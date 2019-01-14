const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateProject = async (parent, {id, name, deadline}, ctx) => {
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
		throw new NotFoundError(`Project ${id} has not been found.`);
	}

	if (typeof name === 'string' && name.length === 0) {
		throw new Error('The new project name must not be empty.');
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			name,
			deadline,
		},
	});
};

module.exports = {
	updateProject,
};
