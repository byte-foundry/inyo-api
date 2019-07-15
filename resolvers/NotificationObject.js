const NotificationObject = {
	__resolveType(obj, context, info) {
		if (obj.token) {
			return 'Project';
		}
		if (obj.email) {
			return 'User';
		}
		return 'Item';
	},
};

module.exports = {
	NotificationObject,
};
