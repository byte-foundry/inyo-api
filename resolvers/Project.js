const Project = {
	id: node => node.id,
	name: node => node.name,
	template: node => node.template,
	customer: (node, args, ctx) => ctx.db.project({id: node.id}).customer(),
	issuer: (node, args, ctx) => ctx.db
		.project({id: node.id})
		.customer()
		.serviceCompany(),
	status: node => node.status,
	sections: (node, args, ctx) => ctx.db.project({id: node.id}).sections(),
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Project,
};
