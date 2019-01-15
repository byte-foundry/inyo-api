const {prisma} = require('../generated/prisma-client');

const endSnoozeItem = async ({itemId}) => {
	await prisma.updateItem({
		where: {id: itemId},
		data: {status: 'PENDING'},
	});
};

module.exports = {
	endSnoozeItem,
};
