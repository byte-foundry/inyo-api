const Owner = {
	__resolveType(obj, context, info) {
		if (obj.name) {
			return 'Customer';
		}
		return 'User';
	},
};

module.exports = {
	Owner,
};
