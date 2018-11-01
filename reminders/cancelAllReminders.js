const https = require('https');
const cancelReminder = require('./cancelReminder.js');

const options = {
	method: 'GET',
	hostname: 'api.posthook.io',
	path: '/v1/hooks',
	headers: {
		'X-API-Key': process.env.POSTHOOK_API_KEY,
	},
};

const req = https.request(options, (res) => {
	const chunks = [];

	res.on('data', (chunk) => {
		chunks.push(chunk);
	});

	res.on('end', () => {
		const body = JSON.parse(Buffer.concat(chunks).toString());

		body.data.forEach(async (hook) => {
			try {
				await cancelReminder(hook.id);
				console.log(`${hook.id} canceled`);
			}
			catch (error) {
				console.log(`${hook.id} errored`);
			}
		});
	});
});

req.end();
