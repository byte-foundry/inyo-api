const Comment = {
  text: node => node.text,
  author: async (node, args, ctx) => {
    const user = await ctx.db.comment({ id: node.id }).authorUser();
    const customer = await ctx.db.comment({ id: node.id }).authorCustomer();

    return user || customer;
  },
  createdAt: node => node.createdAt,
}

module.exports = {
  Comment,
}