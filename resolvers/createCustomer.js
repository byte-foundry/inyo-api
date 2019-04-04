const uuid = require('uuid/v4');

const {getUserId} = require('../utils');

const createCustomer = async (
	parent,
	{
		email: rawEmail, name, firstName, lastName, title, phone,
	},
	ctx,
) => {
	const email = String(rawEmail || '').toLowerCase() || undefined;
	const company = await ctx.db.user({id: getUserId(ctx)}).company();

	return ctx.db.createCustomer({
		token: uuid(),
		email,
		name,
		firstName,
		lastName,
		title,
		phone,
		serviceCompany: {
			connect: {id: company.id},
		},
	});
};

module.exports = {
	createCustomer,
};
