const EventObject = {
	__resolveType(obj, context, info) {
		if (obj.filename) {
			return 'File';
		}
		if (obj.token) {
			return 'Project';
		}
		if (obj.status !== undefined && obj.position !== undefined) {
			return 'Item';
		}
		if (obj.text !== undefined) {
			return 'Comment';
		}
		if (obj.sendingDate !== undefined) {
			return 'Reminder';
		}
		if (obj.name !== undefined) {
			return 'Section';
		}
	},
};

module.exports = {
	EventObject,
};
