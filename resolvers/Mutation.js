const { hash, compare } = require('bcrypt')
const { sign } = require('jsonwebtoken')
const uuid = require('uuid/v4')
const moment = require('moment');

const { APP_SECRET, getUserId } = require('../utils')
const { sendMetric } = require('../stats');
const {sendQuoteEmail, setupQuoteReminderEmail} = require('../emails/QuoteEmail');
const {sendTaskValidationEmail} = require('../emails/TaskEmail');
const {sendAmendmentEmail, setupAmendmentReminderEmail} = require('../emails/AmendmentEmail');

const inyoQuoteBaseUrl = 'https://app.inyo.com/app/quotes';

const Mutation = {
  signup: async (parent, { email, password, firstName, lastName, company = {}}, ctx) => {
    const hashedPassword = await hash(password, 10)
    const defaultDailyPrice = 350;

    const user = await ctx.db.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      defaultDailyPrice,
      company: {
        create: company,
      },
    });

    sendMetric({metric: 'inyo.user.created'});

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
  updateUser: async (parent, { email, firstName, lastName, company, defaultVatRate, defaultDailyPrice }, ctx) => {
    const userId = getUserId(ctx);

    return ctx.db.updateUser({
      where: { id: userId },
      data: {
        email,
        firstName,
        lastName,
        defaultVatRate,
        defaultDailyPrice,
        company: company && {
          update: {
            ...company,
            address: company.address && {
              upsert: {
                create: company.address,
                update: company.address,
              },
            },
          },
        },
      },
    });
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
  createQuote: async (parent, { customerId, customer, name, template, option }, ctx) => {
    const userCompany = await ctx.db.user({ id: getUserId(ctx) }).company()

    if (!customerId && !customer) {
      throw new Error('You must define either a customer or set an existing customer id.')
    }

    let variables = {};
    if (!customerId) {
      variables.customer = { create: {
        ...customer,
        serviceCompany: { connect: { id: userCompany.id } },
        address: {
          create: { ...customer.address },
        },
      } };
    } else {
      variables.customer = {
        connect: { id: customerId },
      };
    }

    const result = await ctx.db.createQuote({
      ...variables,
      name: name || 'Nom du projet',
      template,
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

    sendMetric({metric: 'inyo.quote.created'});

    return result;
  },
  updateQuote: async (parent, { id, name, option }, ctx) => {
    const [quote] = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes({ where: { id } })

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
  removeQuote: async (parent, { id }, ctx) => {
    const quotes = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes({ where: { id } });

    if (!quotes.length) {
      return null;
    }

    return ctx.db.deleteQuote({ id });
  },
  // addOption: async (parent, { quoteId, name, sections }, ctx) => {
  //   const quote = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quote({ id: quoteId });

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
  //   const option = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options({ where: { id } });

  //   return ctx.db.deleteOption({
  //     id,
  //   });
  // },
  addSection: async (parent, { optionId, name, items = [] }, ctx) => {
    const option = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options({ where: { id: optionId } });

    return ctx.db.createSection({
      option: {
        connect: { id: optionId },
      },
      name,
      items: { create: items },
    });
  },
  updateSection: async (parent, { id, name }, ctx) => {
    const sections = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options().sections({ where: { id } });

    if (!sections.length) {
      throw new Error(`No section with id '${id}' has been found`);
    }

    return ctx.db.updateSection({
      where: { id },
      data: { name },
    });
  },
  removeSection: async (parent, { id }, ctx) => {
    const sections = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options().sections({ where: { id } });

    if (!sections.length) {
      return null;
    }

    return ctx.db.deleteSection({ id });
  },
  addItem: async (parent, { sectionId, name, description, unitPrice, unit, vatRate }, ctx) => {
    const sections = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options().sections({ where: { id: sectionId } });

    if (!sections.length) {
      throw new Error(`No section with id '${sectionId}' has been found`);
    }

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
    const items = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options().sections().items({ where: { id } });

    if (!items.length) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    const item = await ctx.db.item({ id }).$fragment(`
      fragment ItemWithQuote on Item {
        status
        section {
          option {
            quote {
              status
            }
          }
        }
      }
    `);

    if (item.section.option.quote.status !== 'DRAFT') {
      throw new Error(`Item '${id}' cannot be updated in this quote state.`);
    }

    return ctx.db.updateItem({
      where: { id },
      data: {
        name,
        description,
        unit,
        unitPrice,
        vatRate,
        status: 'PENDING',
      },
    });
  },
  updateValidatedItem: async (parent, { id, unit, comment }, ctx) => {
    const userId = getUserId(ctx);
    const items = await ctx.db.user({ id: userId }).company().customers().quotes().options().sections().items({ where: { id } });

    if (!items.length) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    const item = await ctx.db.item({ id }).$fragment(`
      fragment ValidatedItemWithQuote on Item {
        status
        section {
          option {
            quote {
              status
            }
          }
        }
      }
    `);

    if (item.section.option.quote.status !== 'ACCEPTED') {
      throw new Error(`Item '${id}' cannot be updated in this quote state.`);
    }

    const result = await ctx.db.updateItem({
      where: { id },
      data: {
        pendingUnit: unit,
        status: 'UPDATED',
        comments: {
          create: {
            text: comment.text,
            authorUser: {
              connect: { id: userId },
            },
          },
        },
      },
    });

    sendMetric({metric: 'inyo.item.updated'});

    return result;
  },
  removeItem: async (parent, { id }, ctx) => {
    const item = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options().sections().items({ where: { id } });

    return ctx.db.deleteItem({ id });
  },
  sendQuote: async (parent, { id, customer }, ctx) => {
    const user = await ctx.db.user({ id: getUserId(ctx) });
    // todo: verify quote ownership
    const quote = await ctx.db.quote({ id }).$fragment(`
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
    `);

    if (!quote) {
      throw new Error(`No quote '${id}' has been found`);
    }

    if (quote.status !== 'DRAFT') {
      throw new Error('This invoice has already been sent.');
    }

    //sending the quote via sendgrid
    //this use the quote template
	try {
    await sendQuoteEmail({
      email: quote.customer.email,
      customerName: quote.customer.name,
      projectName: quote.name,
      user: `${user.firstName} ${user.lastName}`,
      quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
    });
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Quote Email sent to ${quote.customer.email}`);
	}
	catch (error) {
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Quote Email not sent with error ${error}`);
	}

    try {
    setupQuoteReminderEmail({
      email: quote.customer.email,
      customerName: quote.customer.name,
      projectName: quote.name,
      user: `${user.firstName} ${user.lastName}`,
      issueDate: moment().format(),
      quoteId: quote.id,
      quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
    }, ctx);
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Quote reminder setup finished`);
	}
	catch (error) {
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Quote reminder setup errored with error ${error}`);
	}

    // send mail with token

    sendMetric({metric: 'inyo.quote.sent'});

    return ctx.db.updateQuote({
      where: { id },
      data: {
        status: 'SENT',
        issuedAt: new Date(),
      },
    })
  },
  finishItem: async (parent, { id }, ctx) => {
    const user = await ctx.db.user({ id: getUserId(ctx) });
    const items = await ctx.db.user({ id: user.id }).company().customers().quotes().options().sections().items({ where: { id } });

    if (!items.length) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    const item = await ctx.db.item({ id }).$fragment(`
      fragment ItemWithQuote on Item {
        name
        status
        section {
          option {
            sections {
              items {
                name
                unit
              }
            }
            quote {
              id
              token
              customer {
                firstName
                lastName
                email
              }
              status
            }
          }
        }
      }
    `);

    if (item.section.option.quote.status !== 'ACCEPTED' || item.status !== 'PENDING') {
      throw new Error(`Item '${id}' cannot be finished.`);
    }

    const {sections} = item.section.option;
    const {quote} = item.section.option;
    const {customer} = quote;

	  const sectionsTosend = sections.map(
		  section => {
			  console.log(section.itms);
			  return section.items
			  .filter(item => item.status === 'PENDING')
			  .map(item => {
				  console.log(item);
				  return {
					name: item.name,
					unit: item.unit,
				  }
			  }),
			});
	  try {
		await sendTaskValidationEmail({
		  email: customer.email,
		  user: String(user.firstName + ' ' + user.lastName).trim(),
		  customerName: String(customer.firstName + ' ' + customer.lastName).trim(),
		  projectName: quote.name,
		  itemName: item.name,
		  sections: sectionsTosend,
		  quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
		});
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Task validation email sent to ${customer.email}`);
	  }
	  catch (error) {
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Task validation email not because with error ${error}`);
	  }

    sendMetric({metric: 'inyo.item.validated'});

    return ctx.db.updateItem({
      where: { id },
      data: {
        status: 'FINISHED',
      },
    });
  },
  sendAmendment: async (parent, { quoteId }, ctx) => {
    const user = await ctx.db.user({ id: getUserId(ctx) });
    const quote = await ctx.db.quote({ id: quoteId }).$fragment(`
      fragment quoteWithItems on Quote {
	    id
	    token
        status
        customer {
          email
          firstName
          lastName
        }
        options {
          sections {
            items(where: { status: UPDATED }) {
              id
              name
              unit
              pendingUnit
              comments {
                text
                authorUser {
                  firstName
                  lastName
                }
                authorCustomer {
                  name
                  firstName
                  lastName
                }
              }
            }
          }
        }
      }
    `)

    if (!quote) {
      throw new Error(`No quote with id '${id}' has been found`);
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error(`An amendment for quote '${id}' can't be sent in this state.`);
    }

    const items = quote.options.reduce((ids, option) => ids.concat(
      option.sections.reduce((ids, section) => ids.concat(
        section.items.map(item => ({
          ...item,
          author: item.authorUser || item.authorCustomer,
        }))
      ), []),
    ), []);

    await ctx.db.updateManyItems({
      where: {
        id_in: items.map(item => item.id),
      },
      data: {
        status: 'UPDATED_SENT',
      },
    });

    sendMetric({metric: 'inyo.item.updated_sent', count: items.length});

	  try {
		  await sendAmendmentEmail({
			  email: quote.customer.email,
			  user: String(user.firstName + ' ' + user.lastName).trim(),
			  customerName: String(quote.customer.firstName + ' ' + quote.customer.lastName).trim(),
			  projectName: quote.name,
			  quoteUrl: `${inyoQuoteBaseUrl}/app/quotes/${quote.id}/view/${quote.token}`,
			  items,
			});
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Amendment Email sent to ${quote.customer.email}`);
	  }
	  catch (error) {
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Amendment Email not sent with error ${error}`);
	  }

	  try {
		await setupAmendmentReminderEmail({
		  email: quote.customer.email,
		  user: String(user.firstName + ' ' + user.lastName).trim(),
		  customerName: String(quote.customer.firstName + ' ' + quote.customer.lastName).trim(),
		  projectName: quote.name,
		  quoteUrl: `${inyoQuoteBaseUrl}${quote.id}?token=${quote.token}`,
		  items,
		}, ctx);
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Amendment reminder setup finished with id`);
	  }
	  catch (error) {
		  console.log(`${Date.now().toLocaleString('fr-FR')}: Amendment reminder not setup with error ${error}`);
	  }

    sendMetric({metric: 'inyo.amendment.sent'});

    return ctx.db.quote({ id: quoteId });
  },
  acceptItem: async (parent, { id, token }, ctx) => {
    const [item] = await ctx.db.items({ where: {
      id,
      section: { option: { quote: { token } } },
    } }).$fragment(`
      fragment ItemWithQuote on Item {
        status
        pendingUnit
        section {
          option {
            quote {
              status
            }
          }
        }
      }
    `);

    if (!item) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    if (item.status !== 'UPDATED_SENT' || item.section.option.quote.status !== 'ACCEPTED') {
      throw new Error(`Item '${id}' cannot be updated in this item or quote state.`);
    }

    const result = await ctx.db.updateItem({
      where: { id },
      data: {
        status: 'PENDING',
        unit: item.pendingUnit,
        pendingUnit: null,
      },
    });

    sendMetric({metric: 'inyo.item.accepted'});

    return result;
  },
  rejectItem: async (parent, { id, token }, ctx) => {
    const [item] = await ctx.db.items({ where: {
      id,
      section: { option: { quote: { token } } },
    } }).$fragment(`
      fragment ItemWithQuote on Item {
        status
        pendingUnit
        section {
          option {
            quote {
              status
            }
          }
        }
      }
    `);

    if (!item) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    if (item.status !== 'UPDATED_SENT' || item.section.option.quote.status !== 'ACCEPTED') {
      throw new Error(`Item '${id}' cannot be updated in this item or quote state.`);
    }

    return ctx.db.updateItem({
      where: { id },
      data: {
        status: 'PENDING',
        pendingUnit: null,
      },
    });
  },
  acceptQuote: async (parent, { id, token }, ctx) => {
    const [quote] = await ctx.db.quotes({where: {id, token } });

    if (!quote || quote.status !== 'SENT') {
      throw new Error(`No quote with id '${id}' has been found`);
    }

    const result = await ctx.db.updateQuote({
      where: {id},
      data: {status: 'ACCEPTED'},
    })

    sendMetric({metric: 'inyo.quote.created'});

    return result;
  },
  rejectQuote: async (parent, {id, token}, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id, token } });

    if (quote.status !== 'SENT') {
      throw new Error('This quote has already been verified.');
    }

    return ctx.db.updateQuote({
      where: {id},
      data: {status: 'REJECTED'},
    })
  },
  acceptAmendment: async (parent, { quoteId, token }, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id: quoteId, token } }).$fragment(`
      fragment quoteWithItem on Quote {
        status
        options {
          sections {
            items {
              id
              pendingUnit
            }
          }
        }
      }
    `);

    if (!quote) {
      throw new Error(`Quote '${id}' has not been found.`)
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error(`Quote '${id}' cannot be updated in this state.`);
    }

    const items = quote.options.reduce((ids, option) => ids.concat(
      option.sections.reduce((ids, section) => ids.concat(
        section.items.map(item => item.id)
      ), []),
    ), []);

    await ctx.db.updateManyItems({
      where: {
        id_in: items.map(item => item.id),
      },
      data: {
        status: 'PENDING',
        unit: items.map(item => item.pendingUnit),
        pendingUnit: null,
      },
    });

    return ctx.db.quote({ id: quoteId });
  },
  rejectAmendment: async (parent, { quoteId, token }, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id: quoteId, token } }).$fragment(`
      fragment quoteWithItem on Quote {
        status
        options {
          sections {
            items {
              id
            }
          }
        }
      }
    `);

    if (!quote) {
      throw new Error(`Quote '${id}' has not been found.`)
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error(`Quote '${quoteId}' cannot be rejected in this state.`);
    }

    await ctx.db.updateManyItems({
      where: {
        id_in: items.map(item => item.id),
      },
      data: {
        status: 'PENDING',
        pendingUnit: null,
      },
    });

    return ctx.db.quote({ id: quoteId });
  },
}

module.exports = {
  Mutation,
}
