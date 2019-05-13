const NotificationEmitter = {
	__resolveType(obj, context, info) {
		if (obj.name) {
			return 'Customer';
		}
		return 'User';
	},
};

module.exports = {
	NotificationEmitter,
};
