const Item = {
	id: node => node.id,
	name: node => node.name,
	linkedCustomer: async (node, args, ctx) => {
		const linkedCustomer = await ctx.db.item({id: node.id}).linkedCustomer();
		const projectCustomer = await ctx.db
			.item({id: node.id})
			.section()
			.project()
			.customer();

		return linkedCustomer || projectCustomer;
	},
	owner: async (node, args, ctx) => {
		const owner = await ctx.db.item({id: node.id}).owner();
		const projectOwner = await ctx.db
			.item({id: node.id})
			.section()
			.project()
			.customer()
			.serviceCompany()
			.owner();

		return owner || projectOwner;
	},
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
	dueDate: node => node.dueDate,
};

module.exports = {
	Item,
};
