const gql = String.raw;
const slugify = require('slugify');
const sendGridClient = require('@sendgrid/client');

const {formatName} = require('../utils');

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

const UserWithSettings = gql`
	fragment UserWithSettings on User {
		email
		lastName
		firstName
		settings {
			assistantName
		}
	}
`;

async function sendEmail({
	email, meta, data, templateId, replyTo,
}, ctx) {
	let assistantName = 'Edwige';

	let userSignatureName = '';

	let user;

	if (meta && meta.userId) {
		user = await ctx.db.user({id: meta.userId}).$fragment(UserWithSettings);

		userSignatureName = formatName(user.firstName, user.lastName);

		({assistantName} = user.settings);
	}

	const assistantEmailName = slugify(assistantName.toLowerCase());

	const request = {
		method: 'POST',
		url: '/v3/mail/send',
		body: {
			from: {
				name: assistantName,
				email: `${assistantEmailName}@inyo.me`,
			},
			reply_to: {
				email: replyTo || (user ? user.email : 'suivi@inyo.me'),
				name: user ? formatName(user.firstName, user.lastName) : 'Suivi Inyo',
			},
			personalizations: [
				{
					to: [
						{
							email,
						},
					],
					dynamic_template_data: {...data, assistantName, userSignatureName},
				},
			],
			template_id: templateId,
		},
	};

	try {
		return sendGridClient.request(request);
	}
	catch (err) {
		console.log('Error when calling SendGrid', err.response.body.errors);
		throw new Error('Error when sending email');
	}
}

module.exports = sendEmail;
