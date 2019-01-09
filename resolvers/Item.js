const Item = {
	id: node => node.id,
	name: node => node.name,
	type: node => node.type,
	unitPrice: node => node.unitPrice,
	pendingUnit: node => node.pendingUnit,
	unit: node => node.unit,
	section: (node, args, ctx) => ctx.db.item({id: node.id}).section(),
	comments: (node, args, ctx) => ctx.db.item({id: node.id}).comments(),
	vatRate: node => node.vatRate,
	status: node => node.status,
	reviewer: node => node.reviewer,
};

module.exports = {
	Item,
};
