const { hash, compare } = require('bcrypt')
const { sign } = require('jsonwebtoken')
const uuid = require('uuid/v4')
const moment = require('moment');

const { APP_SECRET, getUserId } = require('../utils')
const { sendMetric } = require('../stats');
const {sendQuoteEmail, setupQuoteReminderEmail, sendAcceptedQuoteEmail, sendRejectedQuoteEmail} = require('../emails/QuoteEmail');
const {sendTaskValidationEmail} = require('../emails/TaskEmail');
const {sendAmendmentEmail, setupAmendmentReminderEmail} = require('../emails/AmendmentEmail');
const cancelReminder = require('../reminders/cancelReminder');

const inyoQuoteBaseUrl = 'https://app.inyo.me/app/quotes';

const Mutation = {
  signup: async (parent, { email, password, firstName, lastName, company = {}}, ctx) => {
    const hashedPassword = await hash(password, 10)

    try {
      const user = await ctx.db.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        company: {
        create: company,
        },
      });

      sendMetric({metric: 'inyo.user.created'});

		  console.log(`${new Date().toISOString()}: user with email ${email} created`);

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user,
      }
    }
	  catch (error) {
		  console.log(`${new Date().toISOString()}: user with email ${email} not created with error ${error}`);
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
	const [section] = await ctx.db.sections({ where: {
		id: sectionId,
		option: {
			quote: {
				customer: {
					serviceCompany: {
						owner: { id: getUserId(ctx) },
					},
				},
			},
		},
	}  }).$fragment(`
		fragment SectionWithQuote on Section {
			id
			option {
				quote {
					status
					customer {
						serviceCompany {
							owner {
								defaultDailyPrice
								defaultVatRate
							}
						}
					}
				}
			}
		}
	`);

    if (!section) {
      throw new Error(`No section with id '${sectionId}' has been found`);
	}

	const { defaultDailyPrice, defaultVatRate } = section.option.quote.customer.serviceCompany.owner;

    return ctx.db.createItem({
      section: {
        connect: { id: sectionId },
      },
	  name,
	  status: section.option.quote.status === 'ACCEPTED' ? 'ADDED' : 'PENDING',
      description,
      unitPrice: unitPrice || defaultDailyPrice,
      unit,
      vatRate: vatRate || defaultVatRate,
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
        status: item.status === 'ADDED' ? 'ADDED' : 'UPDATED',
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
          firstName
          lastName
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
      customerName: String(`${quote.customer.firstName} ${quote.customer.lastName}`).trim(),
      projectName: quote.name,
      user: `${user.firstName} ${user.lastName}`,
      quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
    });
		  console.log(`${new Date().toISOString()}: Quote Email sent to ${quote.customer.email}`);
	}
	catch (error) {
		  console.log(`${new Date().toISOString()}: Quote Email not sent with error ${error}`);
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
		  console.log(`${new Date().toISOString()}: Quote reminder setup finished`);
	}
	catch (error) {
		  console.log(`${new Date().toISOString()}: Quote reminder setup errored with error ${error}`);
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
				name
              items {
                name
                unit
				status
              }
            }
            quote {
              id
              token
              name
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

	  try {
		await sendTaskValidationEmail({
		  email: customer.email,
		  user: String(user.firstName + ' ' + user.lastName).trim(),
		  customerName: String(customer.firstName + ' ' + customer.lastName).trim(),
		  projectName: quote.name,
		  itemName: item.name,
		  sections: sections.map(
			  section => ({
				  name: section.name,
				  timeLeft: section.items
					  .filter(item => item.status === 'PENDING')
					  .reduce((acc, item) => acc + item.unit, 0),
			  }),
		  ).filter(section => section.timeLeft > 0),
		  quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
		});
		  console.log(`${new Date().toISOString()}: Task validation email sent to ${customer.email}`);
	  }
	  catch (error) {
		  console.log(`${new Date().toISOString()}: Task validation email not because with error ${error}`);
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
            items(where: {
				OR: [{
					status: ADDED
				}, {
					status: UPDATED
				}]
			}) {
              id
              name
              status
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
          // This return the last comment made on the item
          comment: item.comments.map(comment => ({
            ...comment,
            author: item.authorUser || item.authorCustomer,
          })).slice(-1)[0],
        }))
      ), []),
    ), []);

    await ctx.db.updateManyItems({
		where: {
		  id_in: items.filter(item => item.status === 'ADDED').map(item => item.id),
		},
		data: {
		  status: 'ADDED_SENT',
		},
	});

    await ctx.db.updateManyItems({
      where: {
        id_in: items.filter(item => item.status === 'UPDATED').map(item => item.id),
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
			  quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
			  items,
			});
		  console.log(`${new Date().toISOString()}: Amendment Email sent to ${quote.customer.email}`);
	  }
	  catch (error) {
		  console.log(`${new Date().toISOString()}: Amendment Email not sent with error ${error}`);
	  }

	  try {
      await setupAmendmentReminderEmail({
        email: quote.customer.email,
        user: String(user.firstName + ' ' + user.lastName).trim(),
        customerName: String(quote.customer.firstName + ' ' + quote.customer.lastName).trim(),
        projectName: quote.name,
        quoteUrl: `${inyoQuoteBaseUrl}${quote.id}?token=${quote.token}`,
        quoteId: quote.id,
        items,
      }, ctx);
		  console.log(`${new Date().toISOString()}: Amendment reminder setup finished with id`);
	  }
	  catch (error) {
		  console.log(`${new Date().toISOString()}: Amendment reminder not setup with error ${error}`);
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
              reminders(where: {
                status: PENDING
              }) {
                id
                postHookId
              }
            }
          }
        }
      }
    `);

    if (!item) {
      throw new Error(`No item with id '${id}' has been found`);
    }

    if (item.section.option.quote.status !== 'ACCEPTED') {
      throw new Error(`Item '${id}' cannot be updated in this quote state.`);
    }

	  item.section.option.quote.reminders.forEach(async (reminder) => {
	    try {
	   	 await cancelReminder(reminder.postHookId);
	   	 await ctx.db.updateReminder({
	   		 where: {id: reminder.id},
	   		 data: {
	   			 status: 'CANCELED',
	   		 }
	   	 });
	     console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} canceled`);
	    }
	    catch (error) {
	     console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} not canceled with error ${error}`);
	    }
	  });

    let result;
    if (item.status === 'ADDED_SENT') {
      result = await ctx.db.updateItem({
        where: { id },
        data: { status: 'PENDING' },
      });
    }
    else if (item.status === 'UPDATED_SENT') {
      result = await ctx.db.updateItem({
        where: { id },
        data: {
          status: 'PENDING',
          unit: item.pendingUnit,
          pendingUnit: null,
        },
      });
    }
    else {
      throw new Error(`Item '${id}' cannot be updated in this state.`);
    }

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

	if (item.section.option.quote.status !== 'ACCEPTED') {
		throw new Error(`Item '${id}' cannot be updated in this quote state.`);
	}

	if (item.status === 'ADDED_SENT') {
		return await ctx.db.removeItem({ id });
	}
	else if (item.status === 'UPDATED_SENT') {
		return await ctx.db.updateItem({
			where: { id },
			data: {
				status: 'PENDING',
				pendingUnit: null,
			},
		});
	}
	else {
		throw new Error(`Item '${id}' cannot be updated in this state.`);
    }
  },
  acceptQuote: async (parent, { id, token }, ctx) => {
    const [quote] = await ctx.db.quotes({where: {id, token } }).$fragment(`
      fragment CustomerUserWithQuote on Quote {
        status
        id
        name
        reminders(where: {
          status: PENDING
        }) {
          id
          postHookId
        }
        options {
          sections {
            items {
              name
            }
          }
        }
        customer {
          serviceCompany {
            owner {
              firstName
              lastName
              email
            }
          }
          firstName
          lastName
        }
      }
    `);
;

    if (!quote || quote.status !== 'SENT') {
      throw new Error(`No quote with id '${id}' has been found`);
    }

	const result = await ctx.db.updateQuote({
		where: { id },
		data: {
			status: 'ACCEPTED',
			acceptedQuotesLogs: {
				create: { ip: ctx.ip },
			},
		},
    })

	 quote.reminders.forEach(async (reminder) => {
		 try {
			 await cancelReminder(reminder.postHookId);
			 await ctx.db.updateReminder({
				 where: {id: reminder.id},
				 data: {
					 status: 'CANCELED',
				 }
			 });
		  console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} canceled`);
		 }
		 catch (error) {
		  console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} not canceled with error ${error}`);
		 }
	 });

	  const user = quote.customer.serviceCompany.owner;
	  try {
		  await sendAcceptedQuoteEmail({
			  email: user.email,
			  user: `${user.firstName} ${user.lastName}`,
			  customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
			  projectName: quote.name,
			  quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/see`,
        firstTask: quote.options[0].sections[0].items[0].name,
		  });

		  console.log(`${new Date().toISOString()}: Acceptance quote email sent to ${user.email}`);
	  }
	  catch(error) {
		  console.log(`${new Date().toISOString()}: Acceptance quote email not sent with error ${error}`);
	  }

    sendMetric({metric: 'inyo.quote.accepted'});

    return result;
  },
  rejectQuote: async (parent, {id, token}, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id, token } }).$fragment(`
      fragment CustomerUserWithQuote on Quote {
        status
		id
		name
		customer {
			serviceCompany {
				owner {
					firstName
					lastName
					email
				}
			}
			firstName
			lastName
		}
      }
    `);

    if (quote.status !== 'SENT') {
      throw new Error('This quote has already been verified.');
    }

    const result = ctx.db.updateQuote({
      where: {id},
      data: {status: 'REJECTED'},
    })

	  const user = quote.customer.serviceCompany.owner;
	  try {
		  await sendRejectedQuoteEmail({
			  email: user.email,
			  user: `${user.firstName} ${user.lastName}`,
			  customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
			  projectName: quote.name,
			  quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/see`,
		  });

		  console.log(`${new Date().toISOString()}: Rejection quote email sent to ${user.owner.email}`);
	  }
	  catch(error) {
		  console.log(`${new Date().toISOString()}: Rejection quote email not sent with error ${error}`);
	  }

    sendMetric({metric: 'inyo.quote.rejected'});
	  return result;
  },
  acceptAmendment: async (parent, { quoteId, token }, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id: quoteId, token } }).$fragment(`
      fragment quoteWithItem on Quote {
        status
        reminders(where: {
          status: PENDING
        }) {
          id
          postHookId
        }
        options {
          sections {
            items(where: {
              OR: [
                {
                  status: UPDATED_SENT
                },
                {
                  status: ADDED_SENT
                }
              ]
            }) {
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
        section.items.map(item => ({id: item.id, pendingUnit: item.pendingUnit}))
      ), []),
    ), []);

    quote.reminders.forEach(async (reminder) => {
      try {
        await cancelReminder(reminder.postHookId);
        await ctx.db.updateReminder({
          where: {id: reminder.id},
          data: {
            status: 'CANCELED',
          }
        });
       console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} canceled`);
      }
      catch (error) {
       console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} not canceled with error ${error}`);
      }
    });

    await Promise.all(items.map(async (item) => {
      await ctx.db.updateItem({
        where: {
          id: item.id,
        },
        data: {
          status: 'PENDING',
          unit: item.pendingUnit,
          pendingUnit: null,
        },
      });
    }));

    ctx.db.createLog({
      ip: ctx.ip,
      acceptedAmendment: {
        connect: { id: quote.id },
      },
    });

    return ctx.db.quote({ id: quoteId });
  },
  rejectAmendment: async (parent, { quoteId, token }, ctx) => {
    const [quote] = await ctx.db.quotes({ where: { id: quoteId, token } }).$fragment(`
      fragment quoteWithItem on Quote {
        status
        reminders(where: {
          status: PENDING
        }) {
          id
          postHookId
        }
        options {
          sections {
            items(where: {
              OR: [
                {
                  status: UPDATED_SENT
                },
                {
                  status: ADDED_SENT
                }
              ]
            }) {
              id
            }
          }
        }
      }
    `);

    const itemIds = quote.options.reduce((ids, option) => ids.concat(
      option.sections.reduce((ids, section) => ids.concat(
        section.items.map(item => item.id)
      ), []),
    ), []);

    if (!quote) {
      throw new Error(`Quote '${id}' has not been found.`)
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error(`Quote '${quoteId}' cannot be rejected in this state.`);
    }

    quote.reminders.forEach(async (reminder) => {
      try {
        await cancelReminder(reminder.postHookId);
        await ctx.db.updateReminder({
          where: {id: reminder.id},
          data: {
            status: 'CANCELED',
          }
        });
       console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} canceled`);
      }
      catch (error) {
       console.log(`${new Date().toISOString()}: reminder with id ${reminder.id} not canceled with error ${error}`);
      }
    });

    await ctx.db.updateManyItems({
      where: {
        id_in: itemIds,
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
