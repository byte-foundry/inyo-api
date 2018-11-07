const https = require('https');

function cancelReminder(postHookId) {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'DELETE',
			hostname: 'api.posthook.io',
			path: `/v1/hooks/${postHookId}`,
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': process.env.POSTHOOK_API_KEY,
			},
		};

		const req = https.request(options, (res) => {
			const chunks = [];

			if (res.statusCode === 400) {
				// Bad request
				// Alert us
				reject(res.statusCode);
			}

			if (res.statusCode === 401) {
				// Unauthorized
				// Problem with API key
				reject(res.statusCode);
			}

			if (res.statusCode === 413) {
				// too large
				// Alert user
				reject(res.statusCode);
			}

			if (res.statusCode === 429) {
				// Quota exceeded
				// Alert us
				reject(res.statusCode);
			}

			if (res.statusCode === 500) {
				// Internal server error
				// Alert posthook
				reject(res.statusCode);
			}

			res.on('data', (chunk) => {
				chunks.push(chunk);
			});

			res.on('end', () => {
				const body = Buffer.concat(chunks);
				const response = JSON.parse(body.toString());

				resolve(response);
			});
		});

		req.end();
	});
}

module.exports = cancelReminder;
