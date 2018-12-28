const {prisma} = require('../generated/prisma-client');

const endSnoozeItem = async ({id}) => {
	await prisma.updateItem({
		where: {id},
		data: {status: 'PENDING'},
	});
};

module.exports = {
	endSnoozeItem,
};
