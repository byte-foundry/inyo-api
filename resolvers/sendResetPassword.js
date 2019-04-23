const {sign} = require('jsonwebtoken');

const {APP_SECRET, getRootUrl} = require('../utils');
const {sendResetPasswordEmail} = require('../emails/UserEmail');

const sendResetPassword = async (parent, {email: rawEmail}, ctx) => {
	const email = String(rawEmail || '').toLowerCase();
	const user = await ctx.db.user({email});

	if (!user) {
		return true;
	}

	try {
		const resetToken = sign({email}, APP_SECRET, {expiresIn: 2 * 60 * 60});

		sendResetPasswordEmail(
			{
				meta: {userId: user.id},
				email,
				user: String(`${user.firstName} ${user.lastName}`).trim(),
				url: getRootUrl(`/auth/reset/${resetToken}`),
			},
			ctx,
		);
	}
	catch (err) {
		throw new Error(
			'Something went wrong went resetting password, please try again.',
		);
	}

	return true;
};

module.exports = {
	sendResetPassword,
};
