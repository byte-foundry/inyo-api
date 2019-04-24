const sendEmail = require('./SendEmail.js');

async function sendCustomerEveningEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-ce9155013d1e4f77920aa27685757a6e',
		},
		ctx,
	);
}

module.exports = {
	sendCustomerEveningEmail,
};
