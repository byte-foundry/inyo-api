const sendEmail = require('./SendEmail.js');

async function sendNewCommentEmail({
	email,
	authorName,
	recipientName,
	itemName,
	projectName,
	comment,
	quoteUrl,
	projectUrl,
}) {
	return sendEmail({
		email,
		data: {
			authorName,
			recipientName,
			projectName,
			itemName,
			comment,
			quoteUrl,
			projectUrl,
		},
		templateId: 'd-47a3e2b14b2847bc85459703c333d459',
	});
}

module.exports = {
	sendNewCommentEmail,
};
