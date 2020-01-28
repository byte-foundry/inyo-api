const Comment = {
	task: (node, args, ctx) => ctx.db.comment({id: node.id}).item(),
	text: node => node.text,
	author: async (node, args, ctx) => {
		if (node.authorUser) {
			return ctx.loaders.userLoader.load(node.authorUser.id);
		}

		if (node.authorCustomer) {
			return ctx.loaders.customerLoader.load(node.authorCustomer.id);
		}

		const user = await ctx.db.comment({id: node.id}).authorUser();
		const customer = await ctx.db.comment({id: node.id}).authorCustomer();

		return user || customer;
	},
	views: (node, args, ctx) => {
		if (node.views) {
			return ctx.loaders.commentViewLoader.loadMany(node.views.map(v => v.id));
		}

		return ctx.db.comment({id: node.id}).views();
	},
	createdAt: node => node.createdAt,
};

module.exports = {
	Comment,
};
