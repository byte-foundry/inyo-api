const sendEmail = require('./SendEmail.js');

async function sendResetPasswordEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-2154456e1baa43038fc4c287510d1566',
		},
		ctx,
	);
}

async function sendMorningEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-c49be8b86fa0404381442fc9461fa470',
		},
		ctx,
	);
}

async function sendDeadlineApproachingMail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: 'd-58819ee68aaf4d4f8a3c69a31bc830aa',
		},
		ctx,
	);
}

module.exports = {
	sendResetPasswordEmail,
	sendMorningEmail,
	sendDeadlineApproachingMail,
};
