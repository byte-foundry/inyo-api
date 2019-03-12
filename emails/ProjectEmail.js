const sendEmail = require('./SendEmail.js');

async function sendProjectStartedEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-651e0ed5b1a84b69bfa6479217417fd7',
	});
}

async function sendProjectCreatedEmail({email, ...data}) {
	return sendEmail({
		email: 'edwige@inyo.me',
		data,
		templateId: 'd-96d142386e474b8992d56cceade9452f',
	});
}

module.exports = {
	sendProjectStartedEmail,
	sendProjectCreatedEmail,
};
