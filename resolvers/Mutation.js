const { hash, compare } = require('bcrypt')
const { sign } = require('jsonwebtoken')
const uuid = require('uuid/v4')
const { APP_SECRET, getUserId } = require('../utils')
const {sendQuoteEmail} = require('../emails/QuoteEmail');

const inyoQuoteBaseUrl = 'https://app.inyo.com/quote/';

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
  createQuote: async (parent, { customerId, customer, template, option }, ctx) => {
    const userCompany = await ctx.db.user({ id: getUserId(ctx) }).company()
    
    if (!customerId && !customer) {
      throw new Error('You must define either a customer or set an existing customer id.')
    }

    let variables = {};
    if (!customerId) {
      variables.customer = { create: {
        ...customer,
        address: {
          create: { ...customer.address },
        },
      } };
    } else {
      variables.customer = {
        connect: { id: customerId },
      };
    }

    return ctx.db.createQuote({
      ...variables,
      name: 'Name of the project',
      template,
      issuer: { connect: { id: userCompany.id } },
      token: uuid(),
      options: {
        create: {
          ...option,
          name: 'A',
          sections: option && option.sections && {
            create: option.sections.map(section => ({
              ...section,
              items: section.items && {
                create: section.items,
              },
            })),
          },
        },
      },
      status: 'DRAFT',
    })
  },
  updateQuote: async (parent, { id, name, option }, ctx) => {
    const [quote] = await ctx.db.user({ id: getUserId(ctx) }).company().quotes({ where: { id } })

    if (option) {
      await ctx.db.updateOption({
        where: { id: option.id },
        update: option,
      });
    }

    return ctx.db.updateQuote({
      where: { id },
      data: { name },
    })
  },
  // addOption: async (parent, { quoteId, name, sections }, ctx) => {
  //   const quote = await ctx.db.user({ id: getUserId(ctx) }).company().quote({ id: quoteId });

  //   return ctx.db.createOption({
  //     quote: { connect: { id: quoteId } },
  //       name,
  //       sections: { create: sections },
  //   });
  // },
  updateOption: (parent, { id, proposal }, ctx) => {
    return ctx.db.updateOption({
      where: { id },
      data: { proposal },
    })
  },
  // removeOption: async (parent, { id }, ctx) => {
  //   const option = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options({ where: { id } });

  //   return ctx.db.deleteOption({
  //     id,
  //   });
  // },
  addSection: async (parent, { optionId, name, items = [] }, ctx) => {
    const option = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options({ where: { id: optionId } });

    return ctx.db.createSection({
      option: {
        connect: { id: optionId },
      },
      name,
      items: { create: items },
    });
  },
  updateSection: async (parent, { id, name }, ctx) => {
    const section = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options().sections({ where: { id } });

    return ctx.db.updateSection({
      where: { id },
      data: { name },
    });
  },
  removeSection: async (parent, { id }, ctx) => {
    const section = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options().sections({ where: { id } });

    return ctx.db.deleteSection({ id });
  },
  addItem: async (parent, { sectionId, name, description, unitPrice, unit, vatRate }, ctx) => {
    const section = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options().sections({ where: { id: sectionId } });

    return ctx.db.createItem({
      section: {
        connect: { id: sectionId },
      },
      name,
      description,
      unitPrice,
      unit,
      vatRate,
    });
  },
  updateItem: async (parent, { id, name, description, unitPrice, unit, vatRate }, ctx) => {
    const item = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options().sections().items({ where: { id } });

    // if not draft -> update pending instead

    return ctx.db.updateItem({
      where: { id },
      data: {
        name,
        description,
        unitPrice,
        unit,
        // pendingUnit: unit, // waiting for customer's approval
        vatRate,
        status: unit ? 'PENDING' : undefined,
      },
    });
  },
  removeItem: async (parent, { id }, ctx) => {
    const item = await ctx.db.user({ id: getUserId(ctx) }).company().quotes().options().sections().items({ where: { id } });

    return ctx.db.deleteItem({ id });
  },
  sendQuote: async (parent, { id, customer }, ctx) => {
    const user = await ctx.db.user({ id: getUserId(ctx) });
    const [quote] = await ctx.db.user({ id: getUserId(ctx) }).company().quotes({ where: { id } }).$fragment(
      `
        fragment QuoteWithCustomer on Quote {
          id
          name
          token
          status
          customer {
            name
            email
          }
        }
      `
    );

    if (quote.status !== 'DRAFT') {
      throw new Error('This invoice has already been sent.');
    }

    //sending the quote via sendgrid
    //this use the quote template
    sendQuoteEmail({
      email: quote.customer.email,
      customerName: quote.customer.name,
      projectName: quote.name,
      user: `${user.firstName} ${user.lastName}`,
      quoteUrl: `${inyoQuoteBaseUrl}${quote.id}?token=${quote.token}`,
    });

    // send mail with token

    return ctx.db.updateQuote({
      where: { id },
      data: {
        status: 'INVOICE_SENT',
        issuedAt: new Date(),
      },
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
  sendEmail: async (parent, {id, email, user, customerName, projectName, quoteUrl}, ctx) => {
    const reminder = await ctx.db.reminder({id});

    try {
      sendQuoteEmail({
        email,
        user,
        customerName,
        projectName,
        quoteUrl,
      });
      ctx.db.updateReminder({
        status: 'SENT',
      });
    }
    catch (errors) {
      ctx.db.updateReminder({
        status: 'ERROR',
      });
    }

    return null;
  }
}

module.exports = {
  Mutation,
}
