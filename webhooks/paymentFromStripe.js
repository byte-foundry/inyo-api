const {prisma} = require('../generated/prisma-client');

const paymentFromStripe = async (req, res) => {
	const requestBody = JSON.parse(req.body);

	try {
		await prisma.updateUser({
			where: {id: requestBody.data.object.client_reference_id},
			data: {
				lifetimePayment: true,
			},
		});

		console.log(
			`Payment processed for user ${
				requestBody.data.object.client_reference_id
			}`,
		);

		res.status(200).send();
	}
	catch (err) {
		console.log(`Payment with error ${JSON.stringify(requestBody)}`);

		res.status(400).send();
	}
};

module.exports = {
	paymentFromStripe,
};
