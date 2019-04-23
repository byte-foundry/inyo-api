const sendEmail = require('./SendEmail.js');

async function sendSignupEmail({email, meta, user}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data: {
				user,
			},
			templateId: 'd-d217b4a0727743cf84282d656382e01a',
		},
		ctx,
	);
}

module.exports = {
	sendSignupEmail,
};
