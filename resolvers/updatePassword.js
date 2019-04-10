const {hash, compare} = require('bcrypt');

const {getUserId} = require('../utils');

const updatePassword = async (parent, {oldPassword, newPassword}, ctx) => {
	const user = await ctx.db.user({id: getUserId(ctx)});

	const valid = await compare(oldPassword, user.password);

	if (!valid) {
		throw new Error('Invalid password');
	}

	const hashedPassword = await hash(newPassword, 10);

	return ctx.db.updateUser({
		where: {id: user.id},
		data: {password: hashedPassword},
	});
};

module.exports = {
	updatePassword,
};
