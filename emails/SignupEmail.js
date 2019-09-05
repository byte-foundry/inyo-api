const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');

async function sendSignupEmail({email, meta, user}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data: {
				user,
			},
			templateId: getTemplateId('d-d217b4a0727743cf84282d656382e01a', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendSignupEmail,
};
