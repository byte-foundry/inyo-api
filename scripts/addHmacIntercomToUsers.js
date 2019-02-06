const crypto = require('crypto');

const {prisma} = require('../generated/prisma-client');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

if (!process.env.INTERCOM_HMAC_KEY) {
	console.log('Provide the env variable INTERCOM_HMAC_KEY');
	process.exit();
}

prisma.users({where: {hmacIntercomId: null}}).then((users) => {
	users.forEach(async ({id, email}) => {
		try {
			const hmac = crypto.createHmac('sha256', process.env.INTERCOM_HMAC_KEY);

			hmac.update(email);
			const hmacIntercomId = hmac.digest('hex');

			const user = await prisma.updateUser({
				where: {id},
				data: {hmacIntercomId},
			});

			console.log(user.id, 'updated');
		}
		catch (e) {
			console.log('oopsie', e);
		}

		await sleep(100);
	});
});
