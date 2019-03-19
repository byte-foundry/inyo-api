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

async function sendSlippingAwayEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-3e839ac33e8445d583bb5705d0dcf08f',
	});
}

module.exports = {
	sendResetPasswordEmail,
	sendMorningEmail,
	sendSlippingAwayEmail,
};
