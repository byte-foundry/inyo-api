const {DATADOG_API_KEY} = process.env;

async function sendMetric({metric, count = 1}) {
	const response = await fetch(
		`https://api.datadoghq.com/api/v1/series?api_key=${DATADOG_API_KEY}`,
		{
			method: 'POST',
			body: JSON.stringify({
				series: [{
					metric,
					type: 'count',
					points: [[Math.floor(Date.now() / 1000), count]],
				}],
			}),
		},
	);

	return response.json();
}

module.exports = {
	sendMetric,
};
