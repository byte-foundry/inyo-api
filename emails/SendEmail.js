const sendGridClient = require('@sendgrid/client');

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({email, data, templateId}) {
	const request = {
		method: 'POST',
		url: '/v3/mail/send',
		body: {
			from: {
				name: 'Edwige Inyo',
				email: 'edwige@inyo.me',
			},
			personalizations: [
				{
					to: [
						{
							email,
						},
					],
					dynamic_template_data: data,
				},
			],
			template_id: templateId,
		},
	};

	try {
		return sendGridClient.request(request);
	}
	catch (err) {
		console.log('Error when calling SendGrid', err.response.body.errors);
		throw new Error('Error when sending email');
	}
}

module.exports = sendEmail;
