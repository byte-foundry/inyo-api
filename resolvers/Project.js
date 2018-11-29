const Project = {
	id: node => node.id,
	name: node => node.name,
	template: node => node.template,
	customer: (node, args, ctx) => ctx.db.project({id: node.id}).customer(),
	issuer: (node, args, ctx) => ctx.db
		.project({id: node.id})
		.customer()
		.serviceCompany(),
	total: async (node, args, ctx) => {
		const {sections} = await ctx.db.project({id: node.id}).$fragment(`
			fragment ProjectUnits on Project {
				sections {
					items {
						unit
					}
				}
			}
		`);

		return sections.reduce(
			(sum, section) => sum + section.items.reduce((itemSum, item) => itemSum + item.unit, 0),
			0,
		);
	},
	status: node => node.status,
	sections: (node, args, ctx) => ctx.db.project({id: node.id}).sections(),
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	deadline: node => node.deadline,
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Project,
};
