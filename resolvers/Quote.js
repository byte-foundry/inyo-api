const Quote = {
	id: node => node.id,
	header: node => node.header,
	footer: node => node.footer,
	sections: (node, args, ctx) => ctx.db.quote({id: node.id}).sections(),
	project: (node, args, ctx) => ctx.loaders.projectLoader.load(node.project.id),
	createdAt: node => node.createdAt,
};

module.exports = {
	Quote,
};
