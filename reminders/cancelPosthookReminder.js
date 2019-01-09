const fetch = require('node-fetch');

const {prisma} = require('../generated/prisma-client');

const cancelPosthook = async (postHookId) => {
	const response = await fetch(
		`https://api.posthook.io/v1/hooks/${postHookId}`,
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

const cancelPosthookReminder = async ({id, postHookId}) => {
	await cancelPosthook(postHookId);

	return prisma.updateReminder({
		where: {id},
		data: {
			status: 'CANCELED',
		},
	});
};

module.exports = {
	cancelPosthookReminder,
};
