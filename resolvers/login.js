const {compare} = require('bcrypt');
const {sign} = require('jsonwebtoken');

const {APP_SECRET} = require('../utils');
const {NotFoundError} = require('../errors');

const login = async (parent, {email: rawEmail, password}, ctx) => {
	const email = String(rawEmail).toLowerCase();
	const user = await ctx.db.user({email});

	if (!user) {
		throw new NotFoundError(`No user found for email: ${email}`);
	}

	const valid = await compare(password, user.password);

	if (!valid) {
		throw new Error('Invalid password');
	}

	return {
		token: sign({userId: user.id}, APP_SECRET),
		user,
	};
};

module.exports = {
	login,
};
