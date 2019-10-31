const {hash} = require('bcrypt');
const crypto = require('crypto');
const {sign} = require('jsonwebtoken');

const {APP_SECRET} = require('../utils');
const {AlreadyExistingError} = require('../errors');
const {sendSignupEmail} = require('../emails/SignupEmail');

const gql = String.raw;

const signup = async (
	parent,
	{
		email: rawEmail,
		password,
		firstName,
		lastName,
		referrer,
		company = {},
		settings = {},
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

	let hasReferrer = false;

	if (referrer) {
		hasReferrer = await ctx.db.$exists.user({email: referrer});
	}

	if (
		settings.language
		&& (settings.language !== 'fr' && settings.language !== 'en')
	) {
		throw new Error('Language is not supported. Must be either fr or en.');
	}

	try {
		const user = await ctx.db.createUser({
			email,
			password: hashedPassword,
			firstName,
			hmacIntercomId,
			lastName,
			referrer: hasReferrer ? {connect: {email: referrer}} : undefined,
			company: {
				create: company,
			},
			settings: {
				create: settings,
			},
		});

		console.log(`user with email ${email} created`);

		if (email.includes('gmail.com')) {
			sendSignupEmail(
				{
					meta: {userId: user.id},
					email,
					user: String(`${firstName} ${lastName}`).trim(),
				},
				{language: settings.language || 'en', ...ctx},
			);
		}

		const collabRequestsToUpdate = await ctx.db.collabRequests({
			where: {
				requesteeEmail: email,
			},
		}).$fragment(gql`
			fragment CollabRequestAndUser on Item {
				id
				requester {
					id
				}
			}
		`);

		await Promise.all(
			collabRequestsToUpdate.map(async (request) => {
				await ctx.db.updateCollabRequest({
					where: {
						id: request.id,
					},
					data: {
						requestee: {connect: {id: user.id}},
						requesteeEmail: null,
					},
				});

				await ctx.db.createUserEvent({
					type: 'COLLAB_ASKED',
					user: {connect: {id: request.requester.id}},
					metadata: {
						collabId: request.id,
					},
					notifications: {
						create: {
							user: {connect: {id: user.id}},
						},
					},
				});
			}),
		);

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
