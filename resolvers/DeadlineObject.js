const DeadlineObject = {
	__resolveType(obj) {
		if (['ONGOING', 'ARCHIVED', 'REMOVED'].includes(obj.status)) {
			return 'Project';
		}
		return 'Item';
	},
};

module.exports = {
	DeadlineObject,
};
