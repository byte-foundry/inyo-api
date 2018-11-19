const sendEmail = require('./SendEmail.js');

async function sendResetPasswordEmail({email, resetUrl}) {
	return sendEmail({
		email,
		data: {resetUrl},
		templateId: 'd-2154456e1baa43038fc4c287510d1566',
	});
}

module.exports = {
	sendResetPasswordEmail,
};
