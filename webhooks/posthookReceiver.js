const crypto = require('crypto');

const {prisma} = require('../generated/prisma-client');
const {
	sendSlippingAwayEmail,
	sendCustomersRecapEmail,
	endSnoozeItem,
} = require('../events');

const posthookReceiver = async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));

	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		console.error('The signature has not been verified.');
		res.status(400).send();
	}

	const [reminder] = await prisma.reminders({
		where: {
			postHookId: req.body.id,
		},
	});

	if (!reminder) {
		res.status(400).send();
		throw new Error('Not found reminder', req.body);
	}

	try {
		if (reminder.status === 'CANCELED') {
			console.log(`Reminder '${reminder.id}' has been canceled, ignoring`);
			res.status(200).send();
			return;
		}

		if (reminder.status === 'SENT') {
			console.log(`Reminder '${reminder.id}' has already been sent, ignoring`);
			res.status(200).send();
			return;
		}

		let callback;

		switch (reminder.type) {
		case 'MORNING_TASKS':
			await prisma.updateReminder({
				where: {id: reminder.id},
				data: {status: 'CANCELED'},
			});

			res.status(200).send();
			return;
		case 'SLIPPING_AWAY':
			callback = sendSlippingAwayEmail;
			break;
		case 'EVENING_RECAP':
			callback = sendCustomersRecapEmail;
			break;
		case 'SNOOZE_END':
			callback = endSnoozeItem;
			break;
		default:
			throw new Error('Unknown reminder', reminder.type);
		}

		const {status = 'SENT'} = (await callback(req.body.data)) || {};

		await prisma.updateReminder({
			where: {id: reminder.id},
			data: {status},
		});

		res.status(200).send();

		return;
	}
	catch (err) {
		console.error('Posthook webhook failed', err);

		await prisma.updateReminder({
			where: {id: reminder.id},
			data: {status: 'ERROR'},
		});
	}

	res.status(400).send();
};

module.exports = {
	posthookReceiver,
};
