function sendMetric({ metric, count = 1 }) {
	return fetch(
		`https://api.datadoghq.com/api/v1/series?api_key=${DATADOG_API_KEY}`,
		{ body: JSON.stringify({ series: [{
			metric,
			points: [[Math.floor(Date.now / 1000), count]],
		}] }) }
	)
}

module.exports = {
	sendMetric,
}
