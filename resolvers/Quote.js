const Quote = {
	id: node => node.id,
	issueNumber: node => node.issueNumber,
	header: node => node.header,
	footer: node => node.footer,
	sections: (node, args, ctx) => ctx.db.quote({id: node.id}).sections(),
	project: (node, args, ctx) => ctx.loaders.projectLoader.load(node.project.id),
	hasTaxes: node => node.hasTaxes,
	taxRate: node => node.taxRate,
	invalid: node => node.invalid,
	acceptedAt: node => node.acceptedAt,
	createdAt: node => node.createdAt,
};

module.exports = {
	Quote,
};
