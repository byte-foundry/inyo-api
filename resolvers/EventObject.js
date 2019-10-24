const EventObject = {
	__resolveType(obj, context, info) {
		if (obj.token) {
			return 'Project';
		}
		if (obj.items !== undefined) {
			return 'Section';
		}
		if (obj.position !== undefined) {
			return 'Item';
		}
		if (obj.text !== undefined) {
			return 'Comment';
		}
		if (obj.sendingDate !== undefined) {
			return 'Reminder';
		}
	},
};

module.exports = {
	EventObject,
};
