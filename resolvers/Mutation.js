const { hash, compare } = require('bcrypt')
const { sign } = require('jsonwebtoken')
const uuid = require('uuid/v4')
const { APP_SECRET, getUserId } = require('../utils')

const Mutation = {
  signup: async (parent, { email, password, firstName, lastName, company = {} }, ctx) => {
    const hashedPassword = await hash(password, 10)
    const user = await ctx.db.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company: {
        create: company,
      },
    })

    return {
      token: sign({ userId: user.id }, APP_SECRET),
      user,
    }
  },
  login: async (parent, { email, password }, ctx) => {
    const user = await ctx.db.user({ email })

    if (!user) {
      throw new Error(`No user found for email: ${email}`)
    }

    const valid = await compare(password, user.password)
    if (!valid) {
      throw new Error('Invalid password')
    }

    return {
      token: sign({ userId: user.id }, APP_SECRET),
      user,
    }
  },
  createCustomer: async (parent, { email }, ctx) => {
    const userCompany = await ctx.db.user({ id: getUserId(ctx) }).company()

    return ctx.db.updateCompany({
      where: {
        id: userCompany.id,
      },
      data: {
        customers: {
          create: {
            email,
          },
        },
      },
    })
  },
  createQuote: async (parent, { customerId }, ctx) => {
    const userCompany = await ctx.db.user({ id: getUserId(ctx) }).company()

    return ctx.db.createQuote({
      issuer: userCompany.id,
      customerId,
      token: uuid(),
      status: 'DRAFT',
    })
  },
  sendQuote: async (parent, { id }, ctx) => {
    const quote = await ctx.db.user({ id: getUserId(ctx) }).company().quote({ id });

    if (quote.status !== 'DRAFT') {
      throw new Error('This invoice has already been sent.');
    }

    // send mail with token

    return ctx.db.updateQuote({
      id,
      status: 'INVOICE_SENT',
      token: 'token4customer',
    })
  },
  acceptInvoice: async (parent, { id, token }, ctx) => {
    const quote = ctx.db.quote({ id, where: { token } })

    if (quote.status !== 'INVOICE_SENT') {
      throw new Error('This quote has already been verified.');
    }

    return ctx.db.updateQuote({
      id,
      status: 'INVOICE_ACCEPTED',
    })
  },
  rejectInvoice: async () => {
    const quote = ctx.db.quote({ id, where: { token } })

    if (quote.status !== 'INVOICE_SENT') {
      throw new Error('This quote has already been verified.');
    }

    return ctx.db.updateQuote({
      id,
      status: 'REJECTED',
    })
  },
}

module.exports = {
  Mutation,
}
