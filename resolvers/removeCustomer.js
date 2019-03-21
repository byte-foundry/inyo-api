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

	return ctx.db.deleteCustomer({id});
};

module.exports = {
	removeCustomer,
};
