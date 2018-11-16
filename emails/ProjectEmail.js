const sendEmail = require('./SendEmail.js');

async function sendProjectStartedEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-5055ed1a146348d9bd8cc440bf1160d8',
	});
}

module.exports = {
	sendProjectStartedEmail,
};
