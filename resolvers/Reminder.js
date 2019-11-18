const Reminder = {
	id: node => node.id,
	item: (node, args, ctx) => (node.type === 'CUSTOMER_REPORT'
		? null
		: ctx.db.reminder({id: node.id}).item()),
	customer: node => (node.type === 'CUSTOMER_REPORT' ? node.customer : null),
	type: node => node.type,
	sendingDate: node => node.sendingDate,
	status: node => node.status,
};

module.exports = {
	Reminder,
};
