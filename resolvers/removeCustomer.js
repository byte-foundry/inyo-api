const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeCustomer = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const existingCustomer = await ctx.db.$exists.customer({
		id,
		serviceCompany: {
			owner: {
				id: userId,
			},
		},
	});

	if (!existingCustomer) {
		throw new NotFoundError(`Customer '${id}' has not been found.`);
	}

	const removedCustomer = await ctx.db.deleteCustomer({id});

	await ctx.db.createUserEvent({
		type: 'REMOVED_CUSTOMER',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: removedCustomer.id,
		},
	});

	return removedCustomer;
};

module.exports = {
	removeCustomer,
};
