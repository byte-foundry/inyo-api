const NotificationObject = {
	__resolveType(obj, context, info) {
		if (obj.token) {
			return 'Project';
		}
		return 'Item';
	},
};

module.exports = {
	NotificationObject,
};
