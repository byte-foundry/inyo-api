const uuid = require('uuid/v4');
const {prisma} = require('../generated/prisma-client');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

prisma
	.customers({
		where: {
			token: null,
		},
	})
	.then((customers) => {
		customers.map(async (customer) => {
			try {
				const updatedCustomer = await prisma.updateCustomer({
					where: {id: customer.id},
					data: {
						token: uuid(),
					},
				});

				console.log(updatedCustomer.id, 'updated token');
			}
			catch (e) {
				console.log('oopsie', e);
			}

			await sleep(100);
		});
	});
