/* eslint-disable no-await-in-loop */

const fetch = require('node-fetch');

function updateIntercomUser(email, data) {
	return fetch('https://api.intercom.io/users', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.INTERCOM_TOKEN}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			email,
			custom_attributes: data,
		}),
	});
}

async function trackProjectCounts(prisma) {
	const subscription = await prisma.$subscribe
		.project({
			mutation_in: ['CREATED', 'UPDATED', 'DELETED'],
		})
		.node()
		.owner();

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const {
			value: {id, email},
		} = await subscription.next();

		const count = await prisma
			.projectsConnection({
				where: {
					owner: {id},
				},
			})
			.aggregate()
			.count();

		await updateIntercomUser(email, {'projects-count': count});
	}
}

function subscribeToUpdateIntercom(prisma) {
	trackProjectCounts(prisma);
}

module.exports = {
	subscribeToUpdateIntercom,
};
