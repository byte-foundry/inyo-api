const sendEmail = require('./SendEmail.js');
const getTemplateId = require('./getTemplateId');

async function sendResetPasswordEmail({email, meta, ...data}, ctx) {
	return sendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-2154456e1baa43038fc4c287510d1566', ctx),
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
			templateId: getTemplateId('d-c49be8b86fa0404381442fc9461fa470', ctx),
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
			templateId: getTemplateId('d-58819ee68aaf4d4f8a3c69a31bc830aa', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendResetPasswordEmail,
	sendMorningEmail,
	sendDeadlineApproachingMail,
};
