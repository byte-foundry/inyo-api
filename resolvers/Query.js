const { getUserId } = require('../utils')

const Query = {
  me: (root, args, ctx) => ctx.db.user({ id: getUserId(ctx) }),
  customer: (root, { id }, ctx) => ctx.db.user({ id: getUserId(ctx) }).company().customer({ id }),
  quote: (root, { id, token }, ctx) => {
    // public access with a secret token inserted in a mail
    if (token) {
      return ctx.db.quote({ id, where: { token } })
    }

    return ctx.db.user({ id: getUserId(ctx) }).company().quote({ id })
  },
}

module.exports = {
  Query,
}
