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
		throw new NotFoundError(`Customer '${id}' has not been found.`);
	}

	const email
		= String(rawEmail || customer.email || '').toLowerCase() || undefined;

	const updatedCustomer = ctx.db.updateCustomer({
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

	await ctx.db.createUserEvent({
		type: 'UPDATED_CUSTOMER',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: updatedCustomer.id,
		},
	});

	return updatedCustomer;
};

module.exports = {
	updateCustomer,
};
