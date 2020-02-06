const crypto = require('crypto');

const {prisma} = require('../generated/prisma-client');
const {
	sendDeadlineApproachingEmail,
	sendCustomersRecapEmail,
	sendReminderEmail,
} = require('../events');

const gql = String.raw;

const posthookReceiver = async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(req.rawBody.toString('utf8'));

	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		console.error('The signature has not been verified.');
		res.status(400).send();
		return;
	}

	const [reminder] = await prisma.reminders({
		where: {
			postHookId: req.body.id,
		},
	});

	if (!reminder) {
		console.log(
			`Reminder '${req.body.id}' has not been found, ignoring`,
			req.body,
		);
		res.status(200).send();
		return;
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
		case 'DEADLINE_APPROACHING':
			callback = sendDeadlineApproachingEmail;
			break;
		case 'EVENING_RECAP':
			callback = sendCustomersRecapEmail;
			break;
		case 'DELAY':
		case 'FIRST':
		case 'SECOND':
		case 'LAST':
		case 'INVOICE_DELAY':
		case 'INVOICE_FIRST':
		case 'INVOICE_SECOND':
		case 'INVOICE_THIRD':
		case 'INVOICE_FOURTH':
		case 'CONTENT_ACQUISITION_DELAY':
		case 'CONTENT_ACQUISITION_FIRST':
		case 'CONTENT_ACQUISITION_SECOND':
		case 'USER_WARNING':
			callback = sendReminderEmail;
			break;
		default:
			console.error('Unknown reminder', reminder, req.body);
			throw new Error('Unknown reminder');
		}

		const {status = 'SENT'} = (await callback(req.body.data, reminder)) || {};

		const updatedReminder = await prisma.updateReminder({
			where: {id: reminder.id},
			data: {status},
		}).$fragment(gql`
			fragment ReminderItem on Reminder {
				item {
					id
					name
					status
					section {
						project {
							id
						}
					}
				}
			}
		`);

		if (
			[
				'DELAY',
				'FIRST',
				'SECOND',
				'LAST',
				'INVOICE_DELAY',
				'INVOICE_FIRST',
				'INVOICE_SECOND',
				'INVOICE_THIRD',
				'INVOICE_FOURTH',
				'CONTENT_ACQUISITION_DELAY',
				'CONTENT_ACQUISITION_FIRST',
				'CONTENT_ACQUISITION_SECOND',
			].includes(reminder.type)
		) {
			await prisma.createUserEvent({
				type: 'SENT_REMINDER',
				metadata: {
					id: updatedReminder.item.id,
					name: updatedReminder.item.name,
				},
				task: {connect: {id: updatedReminder.item.id}},
				project: updatedReminder.item.section && {
					connect: {id: updatedReminder.item.section.project.id},
				},
				reminder: {connect: {id: reminder.id}},
			});
		}

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
