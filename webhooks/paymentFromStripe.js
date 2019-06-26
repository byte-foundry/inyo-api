const IntercomClient = require('intercom-client').Client;
const {prisma} = require('../generated/prisma-client');

const intercom = new IntercomClient({token: process.env.INTERCOM_TOKEN});

const paymentFromStripe = async (req, res) => {
	const requestBody = JSON.parse(req.body);
	const userId = requestBody.data.object.client_reference_id;

	try {
		await prisma.updateUser({
			where: {id: userId},
			data: {
				lifetimePayment: true,
			},
		});
		const {email} = await prisma.user({id: userId});

		intercom.users.update({
			user_id: userId,
			email,
			custom_attributes: {
				paid: true,
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
		console.log(err);

		res.status(400).send();
	}
};

module.exports = {
	paymentFromStripe,
};
