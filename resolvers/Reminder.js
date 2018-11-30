const Reminder = {
	id: node => node.id,
	item: (node, args, ctx) => ctx.db.reminder({id: node.id}).item(),
	type: node => node.type,
	sendingDate: node => node.sendingDate,
	status: node => node.status,
};

module.exports = {
	Reminder,
};
