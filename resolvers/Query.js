const { getUserId } = require('../utils')

const Query = {
  me: (root, args, ctx) => ctx.db.user({ id: getUserId(ctx) }),
  customer: (root, { id }, ctx) => ctx.db.user({ id: getUserId(ctx) }).company().customer({ id }),
  quote: async (root, { id, token }, ctx) => {
    // public access with a secret token inserted in a mail
    if (token) {
      const [quote] = await ctx.db.quotes({ id, where: { token } });

      if (!quote) {
        return null;
      }

      await ctx.db.updateQuote({
        where: { id },
        data: { viewedByCustomer: true },
      });

      return quote;
    }

    const [quote] = await ctx.db.user({ id: getUserId(ctx) }).company().quotes({ where: {id} });

    return quote;
  },
}

module.exports = {
  Query,
}
