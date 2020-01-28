const CommentView = {
	viewer: async (node, args, ctx) => {
		if (node.user) {
			return ctx.loaders.userLoader.load(node.user.id);
		}

		if (node.customer) {
			return ctx.loaders.customerLoader.load(node.customer.id);
		}

		const user = await ctx.db.commentView({id: node.id}).user();
		const customer = await ctx.db.commentView({id: node.id}).customer();

		return user || customer;
	},
	viewedAt: node => node.createdAt,
};

module.exports = {
	CommentView,
};
