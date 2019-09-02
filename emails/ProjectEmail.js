const {getTemplateId} = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');

async function sendProjectStartedEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-651e0ed5b1a84b69bfa6479217417fd7', ctx),
		},
		ctx,
	);
}

async function sendProjectCreatedEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email: 'edwige@inyo.me',
			meta,
			data,
			templateId: getTemplateId('d-96d142386e474b8992d56cceade9452f', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendProjectStartedEmail,
	sendProjectCreatedEmail,
};
