const {getTemplateId} = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');

async function sendNewCommentEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-9037dcd4a6d4435a93546a891cfc1037', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendNewCommentEmail,
};
