const fetch = require('node-fetch');

const {prisma} = require('../generated/prisma-client');

const cancelPosthook = async (posthookId) => {
	const response = await fetch(
		`https://api.posthook.io/v1/hooks/${posthookId}`,
		{
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': process.env.POSTHOOK_API_KEY,
			},
		},
	);

	switch (response.statusCode) {
	case 400:
	case 401:
	case 413:
	case 429:
	case 500:
		return Promise.reject(response.statusCode);
	default:
		return response.json();
	}
};

const cancelPosthookReminder = async ({posthookId}) => {
	await cancelPosthook(posthookId);

	return prisma.updateReminder({
		where: {posthookId},
		status: 'CANCELED',
	});
};

module.exports = {
	cancelPosthookReminder,
};
