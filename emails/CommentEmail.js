const sendEmail = require('./SendEmail.js');

async function sendNewCommentEmail({
	email,
	user,
	authorName,
	recipientName,
	itemName,
	projectName,
	comment,
	quoteUrl,
}) {
	return sendEmail({
		email,
		data: {
			user,
			authorName,
			recipientName,
			projectName,
			itemName,
			comment,
			quoteUrl,
		},
		templateId: 'd-47a3e2b14b2847bc85459703c333d459',
	});
}

module.exports = {
	sendNewCommentEmail,
};