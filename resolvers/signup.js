const {hash} = require('bcrypt');
const crypto = require('crypto');
const {sign} = require('jsonwebtoken');

const {APP_SECRET} = require('../utils');
const {AlreadyExistingError} = require('../errors');
const {sendMetric} = require('../stats');
const {sendSignupEmail} = require('../emails/SignupEmail');

const signup = async (
	parent,
	{
		email: rawEmail, password, firstName, lastName, company = {}, settings = {},
	},
	ctx,
) => {
	const hmac = crypto.createHmac('sha256', process.env.INTERCOM_HMAC_KEY);
	const email = String(rawEmail).toLowerCase();
	const isExisting = await ctx.db.$exists.user({email});

	hmac.update(email);
	const hmacIntercomId = hmac.digest('hex');

	if (isExisting) {
		throw new AlreadyExistingError('This email is already registered');
	}

	const hashedPassword = await hash(password, 10);

	try {
		const user = await ctx.db.createUser({
			email,
			password: hashedPassword,
			firstName,
			hmacIntercomId,
			lastName,
			company: {
				create: company,
			},
			settings: {
				create: settings,
			},
		});

		sendMetric({metric: 'inyo.user.created'});

		console.log(`user with email ${email} created`);

		if (email.includes('gmail.com')) {
			sendSignupEmail({
				email,
				user: String(`${firstName} ${lastName}`).trim(),
			});
		}

		return {
			token: sign({userId: user.id}, APP_SECRET),
			user,
		};
	}
	catch (error) {
		console.log(`user with email ${email} not created with error ${error}`);
		throw error;
	}
};

module.exports = {
	signup,
};
