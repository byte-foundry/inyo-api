const sendEmail = require('./SendEmail.js');

async function sendSignupEmail({email, user}) {
	return sendEmail({
		email,
		data: {
			user,
		},
		templateId: 'd-d217b4a0727743cf84282d656382e01a',
	});
}

module.exports = {
	sendSignupEmail,
};
