const Quote = {
	id: node => node.id,
	header: node => node.header,
	footer: node => node.footer,
	sections: (node, args, ctx) => ctx.db.quote({id: node.id}).sections(),
	project: (node, args, ctx) => {
		if (node.project) {
			return ctx.loaders.projectLoader.load(node.project.id);
		}

		return ctx.loaders.projects.bySectionId.load(node.id);
	},
	createdAt: node => node.createdAt,
};

module.exports = {
	Quote,
};
