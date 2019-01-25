const sendEmail = require('./SendEmail.js');

async function sendResetPasswordEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-2154456e1baa43038fc4c287510d1566',
	});
}

async function sendMorningEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-c49be8b86fa0404381442fc9461fa470',
	});
}

module.exports = {
	sendResetPasswordEmail,
	sendMorningEmail,
};
