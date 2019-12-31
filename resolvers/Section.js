const Section = {
	id: node => node.id,
	name: node => node.name,
	items: (node, args, ctx) => {
		if (node.items) {
			return ctx.loaders.itemLoader.loadMany(node.items.map(t => t.id));
		}

		return ctx.db.section({id: node.id}).items({orderBy: 'position_ASC'});
	},
	project: (node, args, ctx) => {
		if (node.project) {
			return ctx.loaders.projectLoader.load(node.project.id);
		}

		return ctx.loaders.projects.bySectionId.load(node.id);
	},
	position: node => node.position,
	price: node => node.price,
};

module.exports = {
	Section,
};
