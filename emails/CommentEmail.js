const sendEmail = require('./SendEmail.js');

async function sendNewCommentEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-9037dcd4a6d4435a93546a891cfc1037',
	});
}

module.exports = {
	sendNewCommentEmail,
};
