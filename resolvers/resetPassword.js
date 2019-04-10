const {hash} = require('bcrypt');
const {verify} = require('jsonwebtoken');

const {APP_SECRET} = require('../utils');
const {login} = require('./login');

const resetPassword = async (parent, {resetToken, newPassword}, ctx) => {
	// throws if expired or malformed
	const {email} = await verify(resetToken, APP_SECRET);

	const hashedPassword = await hash(newPassword, 10);

	await ctx.db.updateUser({
		where: {email},
		data: {password: hashedPassword},
	});

	return login({}, {email, password: newPassword}, ctx);
};

module.exports = {
	resetPassword,
};
