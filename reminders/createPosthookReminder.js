const fetch = require('node-fetch');

const {prisma} = require('../generated/prisma-client');

const createPosthookCallback = async ({path, postAt, data}) => {
	const response = await fetch('https://api.posthook.io/v1/hooks', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-Key': process.env.POSTHOOK_API_KEY,
		},
		body: JSON.stringify({
			path,
			postAt,
			data,
		}),
	});

	switch (response.status) {
	case 400:
	case 401:
	case 413:
	case 429:
	case 500:
		return Promise.reject(`Posthook errored with ${response.status}`);
	default:
		return response.json();
	}
};

const createPosthookReminder = async ({
	postAt, data, type, ...properties
}) => {
	const response = await createPosthookCallback({
		path: '/posthook-receiver',
		postAt,
		data,
	});

	const reminder = await prisma.createReminder({
		status: 'PENDING',
		postHookId: response.data.id,
		sendingDate: response.data.postAt,
		type,
		...properties,
	});

	console.log(`Reminder ${type} '${reminder.id}' created: ${response.data.id}`);

	return reminder;
};

module.exports = {
	createPosthookReminder,
};
