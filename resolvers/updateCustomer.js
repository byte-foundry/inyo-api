const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateCustomer = async (
	parent,
	{
		id, email: rawEmail, name, firstName, lastName, title, phone, customer = {},
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const [existingCustomer] = await ctx.db.customers({
		where: {
			id,
			serviceCompany: {
				owner: {
					id: userId,
				},
			},
		},
	});

	if (!existingCustomer) {
		throw NotFoundError(`Customer '${id}' has not been found.`);
	}

	const email
		= String(rawEmail || customer.email || '').toLowerCase() || undefined;

	return ctx.db.updateCustomer({
		where: {id},
		data: {
			...customer,
			email,
			name,
			firstName,
			lastName,
			title,
			phone,
		},
	});
};

module.exports = {
	updateCustomer,
};
