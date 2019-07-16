const NotificationObject = {
	__resolveType(obj, context, info) {
		if (obj.token) {
			return 'Project';
		}
		if (obj.email) {
			return 'User';
		}
		if (obj.rejectedAt === null) {
			return 'CollabRequest';
		}
		return 'Item';
	},
};

module.exports = {
	NotificationObject,
};
