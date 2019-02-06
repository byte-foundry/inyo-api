const Item = {
	id: node => node.id,
	name: node => node.name,
	type: node => node.type,
	unitPrice: () => null,
	pendingUnit: node => node.pendingUnit,
	unit: node => node.unit,
	section: (node, args, ctx) => ctx.db.item({id: node.id}).section(),
	comments: (node, args, ctx) => ctx.db.item({id: node.id}).comments(),
	vatRate: () => null,
	status: node => node.status,
	reviewer: node => node.reviewer,
	position: node => node.position,
	timeItTook: node => node.timeItTook,
};

module.exports = {
	Item,
};
