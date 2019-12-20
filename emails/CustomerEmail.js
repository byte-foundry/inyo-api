const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');

async function sendCustomerEveningEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-ce9155013d1e4f77920aa27685757a6e', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendCustomerEveningEmail,
};
