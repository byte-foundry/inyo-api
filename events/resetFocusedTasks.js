const {prisma} = require('../generated/prisma-client');

const resetFocusedTasks = async ({userId}) => {
	await prisma.updateUser({
		where: {
			id: userId,
		},
		data: {
			focusedTasks: {set: []},
		},
	});

	console.log(`Resetted user's '${userId}' tasks`);

	return {status: 'SENT'};
};

module.exports = {
	resetFocusedTasks,
};
