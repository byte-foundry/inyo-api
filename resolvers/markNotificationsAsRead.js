const {getUserId} = require('../utils');

const markNotificationsAsRead = async (parent, args, ctx) => {
	const userId = getUserId(ctx);

	await ctx.db.updateManyNotifications({
		where: {
			user: {id: userId},
		},
		data: {
			unread: false,
		},
	});

	return true;
};

module.exports = {
	markNotificationsAsRead,
};
