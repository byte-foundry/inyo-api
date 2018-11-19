const sendEmail = require('./SendEmail.js');

async function sendProjectStartedEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-651e0ed5b1a84b69bfa6479217417fd7',
	});
}

module.exports = {
	sendProjectStartedEmail,
};
