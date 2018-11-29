const {sendMorningEmail} = require('../emails/UserEmail');

const sendDayTasks = async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));

	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		throw new Error('The signature has not been verified.');
	}

	// sendMorningEmail({});

	console.log(`Sent day tasks to User '${req.body.id}'`);
};
