const Reminder = {
	id: node => node.id,
	item: (node, args, ctx) => {
		if (node.type === 'CUSTOMER_REPORT') {
			return null;
		}
		if (node.item) {
			return ctx.loaders.itemLoader.load(node.item.id);
		}
		if (node.item === null) {
			return null;
		}

		return ctx.loaders.items.byReminderId.load(node.id);
	},
	customer: node => (node.type === 'CUSTOMER_REPORT' ? node.customer : null),
	type: node => node.type,
	sendingDate: node => node.sendingDate,
	status: node => node.status,
};

module.exports = {
	Reminder,
};
