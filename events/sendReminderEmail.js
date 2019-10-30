const {prisma} = require('../generated/prisma-client');
const sendEmail = require('../emails/SendEmail');

const gql = String.raw;

const sendReminderEmail = async ({templateId, email, ...data}) => {
	const {itemId} = data;
	const item = await prisma.items({where: {id: itemId}}).$fragment(gql`
		fragment ItemWithProject on Item {
			id
			name
			status
			section {
				project {
					id
				}
			}
		}
	`);

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

	await prisma.createUserEvent({
		type: 'SENT_REMINDER',
		// user: {
		// 	connect: {id: userId},
		// },
		metadata: {
			id: item.id,
			name: item.name,
		},
		task: {
			connect: {id: itemId},
		},
		project: item.section && {
			connect: {id: item.section.project.id},
		},
	});

	console.log(`Reminder for Item '${itemId}' sent.`);

	return {status: 'SENT'};
};

module.exports = {
	sendReminderEmail,
};
