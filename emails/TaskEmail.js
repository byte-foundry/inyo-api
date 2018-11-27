const sendEmail = require('./SendEmail.js');

// eslint-disable-next-line
async function legacy_sendTaskValidationEmail({
	email,
	user,
	customerName,
	itemName,
	projectName,
	sections,
	quoteUrl,
}) {
	return sendEmail({
		email,
		data: {
			user,
			customerName,
			projectName,
			itemName,
			sections,
			quoteUrl,
		},
		templateId: 'd-83233d7427a642a9a9218f3f7d7db5e0',
	});
}

async function sendTaskValidationEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-fd9cee6d49d54e179210d5a080e58fb3',
	});
}

async function sendTaskValidationWaitCustomerEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-396ebbf7d15e490da4b0b4b86d5f77b0',
	});
}

async function sendItemUpdatedEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-3cf78715bb9f4432add79f198c21b282',
	});
}

module.exports = {
	legacy_sendTaskValidationEmail,
	sendTaskValidationEmail,
	sendTaskValidationWaitCustomerEmail,
	sendItemUpdatedEmail,
};
