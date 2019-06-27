/* eslint-disable no-await-in-loop */

const moment = require('moment');

const gql = String.raw;

async function notifyViewedProject(prisma) {
	const subscription = await prisma.$subscribe
		.customerEvent({
			mutation_in: ['CREATED'],
			node: {type: 'VIEWED_PROJECT'},
		})
		.node().$fragment(gql`
		fragment CustomerEventWithCustomer on CustomerEvent {
			id
			customer {
				id
			}
		}
	`);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const {
			value: {id, customer},
		} = await subscription.next();

		const [user] = await prisma.users({
			where: {
				company: {
					customers_some: {id: customer.id},
				},
				notifications_none: {
					customerEvent: {type: 'VIEWED_PROJECT', customer: {id: customer.id}},
					createdAt_gt: moment()
						.subtract(1, 'days')
						.format(),
				},
			},
		});

		if (user) {
			await prisma.createNotification({
				customerEvent: {connect: {id}},
				user: {connect: {id: user.id}},
			});
		}
	}
}

module.exports = {
	notifyViewedProject,
};
