const uuid = require('uuid/v4');
const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateProject = async (
	parent,
	{
		id, name, customerId, customer, deadline, notifyActivityToCustomer,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const [project] = await ctx.db.projects({
		where: {
			id,
			OR: [
				{
					owner: {id: userId},
				},
				{
					customer: {
						serviceCompany: {
							owner: {
								id: userId,
							},
						},
					},
				},
			],
		},
	});

	if (!project) {
		throw new NotFoundError(`Project ${id} has not been found.`);
	}

	if (typeof name === 'string' && name.length === 0) {
		throw new Error('The new project name must not be empty.');
	}

	if (!notifyActivityToCustomer) {
		await ctx.db.updateManyItems({
			where: {section: {project: {id}}, type: 'CUSTOMER'},
			data: {type: 'DEFAULT'},
		});
	}

	const variables = {};

	if (customerId) {
		variables.customer = {
			connect: {id: customerId},
		};
	}
	else if (customer) {
		const userCompany = await ctx.db.user({id: userId}).company();

		variables.customer = {
			create: {
				...customer,
				email: String(customer.email || '').toLowerCase(),
				token: uuid(),
				serviceCompany: {connect: {id: userCompany.id}},
				address: {
					create: customer.address,
				},
			},
		};
	}
	else if (customerId === null || customer === null) {
		variables.customer = {
			disconnect: true,
		};
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			...variables,
			name,
			deadline,
			notifyActivityToCustomer,
		},
	});
};

module.exports = {
	updateProject,
};
