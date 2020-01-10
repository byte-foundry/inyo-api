const uuid = require('uuid/v4');

const {getUserId} = require('../utils');

const createCustomer = async (
	parent,
	{
		email: rawEmail,
		name,
		firstName,
		lastName,
		title,
		phone,
		occupation,
		address,
		userNotes,
	},
	ctx,
) => {
	const email = String(rawEmail || '').toLowerCase() || undefined;
	const userId = getUserId(ctx);
	const company = await ctx.db.user({id: userId}).company();

	const createdCustomer = await ctx.db.createCustomer({
		token: uuid(),
		email,
		name,
		firstName,
		lastName,
		title,
		phone,
		occupation,
		address: address && {
			create: address,
		},
		userNotes,
		serviceCompany: {
			connect: {id: company.id},
		},
	});

	await ctx.db.createUserEvent({
		type: 'CREATED_CUSTOMER',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: createdCustomer.id,
		},
	});

	return createdCustomer;
};

module.exports = {
	createCustomer,
};
