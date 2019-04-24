const sendEmail = require('./SendEmail.js');

async function sendNewCommentEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-9037dcd4a6d4435a93546a891cfc1037',
		},
		ctx,
	);
}

module.exports = {
	sendNewCommentEmail,
};
