const EventSubject = {
	__resolveType(obj, context, info) {
		if (obj.title) {
			return 'Customer';
		}
		return 'User';
	},
};

module.exports = {
	EventSubject,
};
