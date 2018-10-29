const CommentView = {
	viewer: async (node, args, ctx) => {
		const user = await ctx.db.commentView({ id: node.id }).user();
		const customer = await ctx.db.commentView({ id: node.id }).customer();

		return user || customer;
	},
	viewedAt: node => node.createdAt,
}

module.exports = {
	CommentView,
}
