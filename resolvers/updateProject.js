const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateProject = async (
	parent,
	{
		id, name, deadline, notifyActivityToCustomer,
	},
	ctx,
) => {
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

	if (notifyActivityToCustomer) {
		await ctx.db.updateManyItems({
			where: {section: {id}, reviewer: 'CUSTOMER'},
			data: {reviewer: 'USER'},
		});
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			name,
			deadline,
			notifyActivityToCustomer,
		},
	});
};

module.exports = {
	updateProject,
};
