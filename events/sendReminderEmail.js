const {prisma} = require('../generated/prisma-client');
const sendEmail = require('../emails/SendEmail');

const sendReminderEmail = async ({templateId, email, ...data}) => {
	const {itemId} = data;
	const [item] = await prisma.items({where: {id: itemId}});

	if (!item) {
		throw new Error(`Item '${item.id}' has not been found.`);
	}

	if (item.status === 'FINISHED') {
		console.log(
			`Item '${item.id}' is done. There shouldn't be any pending reminders...`,
		);
		return {status: 'CANCELED'};
	}

	const user = await prisma.item({id: itemId}).owner();

	await sendEmail(
		{
			templateId,
			meta: {
				userId: user.id,
			},
			email,
			data,
		},
		{db: prisma},
	);

	console.log(`Reminder for Item '${itemId}' sent.`);

	return {status: 'SENT'};
};

module.exports = {
	sendReminderEmail,
};
