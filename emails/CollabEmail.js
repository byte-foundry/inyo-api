const getTemplateId = require('./getTemplateId');
const SendEmail = require('./SendEmail.js');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

async function sendRequestCollabEmail({email, meta, ...data}, ctx) {
	return SendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-bbe81269740640c5ae9149707608c7d1', ctx),
		},
		ctx,
	);
}

async function sendAcceptCollabEmail({email, meta, ...data}, ctx) {
	return SendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-8104af645a7942cabe83998a16149431', ctx),
		},
		ctx,
	);
}

async function sendRejectCollabEmail({email, meta, ...data}, ctx) {
	return SendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-fd9014a46c4f41848e87e6a55d84cee5', ctx),
		},
		ctx,
	);
}

async function sendAssignedTaskEmail({email, meta, ...data}, ctx) {
	return SendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-d2ad5a36bac940e0ad25efd664682432', ctx),
		},
		ctx,
	);
}

async function sendRemoveAssignedTaskEmail({email, meta, ...data}, ctx) {
	return SendEmail(
		{
			email,
			meta,
			data,
			templateId: getTemplateId('d-5bfa73debbb640b79697c0684291f952', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendRequestCollabEmail,
	sendAcceptCollabEmail,
	sendRejectCollabEmail,
	sendAssignedTaskEmail,
	sendRemoveAssignedTaskEmail,
};
