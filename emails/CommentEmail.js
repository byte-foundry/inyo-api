const sendEmail = require('./SendEmail.js');

// eslint-disable-next-line
async function legacy_sendNewCommentEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-47a3e2b14b2847bc85459703c333d459',
	});
}

async function sendNewCommentEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-9037dcd4a6d4435a93546a891cfc1037',
	});
}

module.exports = {
	legacy_sendNewCommentEmail,
	sendNewCommentEmail,
};
