const NotificationObject = {
	__resolveType(obj, context, info) {
		if (obj.token) {
			return 'Project';
		}
		if (obj.email) {
			return 'User';
		}
		if (obj.position !== undefined) {
			return 'Item';
		}
		return 'CollabRequest';
	},
};

module.exports = {
	NotificationObject,
};
