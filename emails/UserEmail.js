const sendEmail = require('./SendEmail.js');

async function sendResetPasswordEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-2154456e1baa43038fc4c287510d1566',
	});
}

async function sendMorningEmail() {}

async function sendEveningEmail() {}

module.exports = {
	sendResetPasswordEmail,
	sendMorningEmail,
	sendEveningEmail,
};
