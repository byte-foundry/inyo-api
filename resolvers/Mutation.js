const {hash, compare} = require('bcrypt');
const {sign, verify} = require('jsonwebtoken');
const uuid = require('uuid/v4');
const moment = require('moment');

const gql = String.raw;

const {APP_SECRET, getUserId} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {processUpload} = require('../files');
const {sendMetric} = require('../stats');
const {
	sendQuoteEmail,
	setupQuoteReminderEmail,
	sendAcceptedQuoteEmail,
	sendRejectedQuoteEmail,
} = require('../emails/QuoteEmail');
const {sendTaskValidationEmail} = require('../emails/TaskEmail');
const {
	sendAmendmentEmail,
	setupAmendmentReminderEmail,
} = require('../emails/AmendmentEmail');
const {sendNewCommentEmail} = require('../emails/CommentEmail');
const {sendResetPasswordEmail} = require('../emails/UserEmail');
const cancelReminder = require('../reminders/cancelReminder');

const {createProject} = require('./createProject');
const {updateProject} = require('./updateProject');
const {removeProject} = require('./removeProject');

const inyoQuoteBaseUrl = 'https://app.inyo.me/app/quotes';
const inyoProjectBaseUrl = 'https://app.inyo.me/app/quotes';

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const Mutation = {
	signup: async (
		parent,
		{
			email, password, firstName, lastName, company = {}, settings = {},
		},
		ctx,
	) => {
		const hashedPassword = await hash(password, 10);

		try {
			const user = await ctx.db.createUser({
				email,
				password: hashedPassword,
				firstName,
				lastName,
				company: {
					create: company,
				},
				settings: {
					create: settings,
				},
			});

			sendMetric({metric: 'inyo.user.created'});

			console.log(
				`${new Date().toISOString()}: user with email ${email} created`,
			);

			return {
				token: sign({userId: user.id}, APP_SECRET),
				user,
			};
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: user with email ${email} not created with error ${error}`,
			);
			throw error;
		}
	},
	sendResetPassword: async (parent, {email}) => {
		try {
			const resetToken = sign({email}, APP_SECRET, {expiresIn: 2 * 60 * 60});

			sendResetPasswordEmail({
				email,
				resetUrl: `https://inyo.me/reset/${resetToken}`,
			});
		}
		catch (err) {
			throw new Error(
				'Something went wrong went resetting password, please try again.',
			);
		}

		return true;
	},
	checkResetPassword: async (parent, {resetToken}) => {
		// throws if expired or malformed
		await verify(resetToken, APP_SECRET);

		return true;
	},
	resetPassword: async (parent, {resetToken, newPassword}, ctx) => {
		// throws if expired or malformed
		const {email} = await verify(resetToken, APP_SECRET);

		const hashedPassword = await hash(newPassword, 10);

		return ctx.db.updateUser({
			where: {email},
			data: {password: hashedPassword},
		});
	},

	login: async (parent, {email, password}, ctx) => {
		const user = await ctx.db.user({email});

		if (!user) {
			throw new NotFoundError(`No user found for email: ${email}`);
		}

		const valid = await compare(password, user.password);

		if (!valid) {
			throw new Error('Invalid password');
		}

		return {
			token: sign({userId: user.id}, APP_SECRET),
			user,
		};
	},
	updatePassword: async (parent, {oldPassword, newPassword}, ctx) => {
		const user = await ctx.db.user({id: getUserId(ctx)});

		const valid = await compare(oldPassword, user.password);

		if (!valid) {
			throw new Error('Invalid password');
		}

		const hashedPassword = await hash(newPassword, 10);

		return ctx.db.updateUser({
			where: {id: user.id},
			data: {password: hashedPassword},
		});
	},
	updateUser: async (
		parent,
		{
			email,
			firstName,
			lastName,
			company,
			defaultVatRate,
			defaultDailyPrice,
			workingFields,
			jobType,
			interestedFeatures,
			hasUpcomingProject,
			settings,
		},
		ctx,
	) => {
		const userId = getUserId(ctx);

		let logo;

		if (company && company.logo) {
			logo = await processUpload(company.logo, ctx, userId);
		}

		return ctx.db.updateUser({
			where: {id: userId},
			data: {
				email,
				firstName,
				lastName,
				defaultVatRate,
				defaultDailyPrice,
				workingFields: {set: workingFields},
				jobType,
				interestedFeatures: {set: interestedFeatures},
				hasUpcomingProject,
				company: company && {
					update: {
						...company,
						address: company.address && {
							upsert: {
								create: company.address,
								update: company.address,
							},
						},
						logo: logo && {connect: {id: logo.id}},
					},
				},
				settings: settings && {
					update: settings,
				},
			},
		});
	},
	createCustomer: async (parent, {email}, ctx) => {
		const userCompany = await ctx.db.user({id: getUserId(ctx)}).company();

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
		});
	},
	createProject,
	updateProject,
	removeProject,
	createQuote: async (
		parent,
		{
			customerId, customer, name, template, option,
		},
		ctx,
	) => {
		const userCompany = await ctx.db.user({id: getUserId(ctx)}).company();

		if (!customerId && !customer) {
			throw new InsufficientDataError(
				'You must define either a customer or set an existing customer id.',
			);
		}

		const variables = {};

		if (customerId) {
			variables.customer = {
				connect: {id: customerId},
			};
		}
		else {
			variables.customer = {
				create: {
					...customer,
					serviceCompany: {connect: {id: userCompany.id}},
					address: {
						create: {...customer.address},
					},
				},
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
					sections: option
						&& option.sections && {
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
		});

		sendMetric({metric: 'inyo.quote.created'});

		return result;
	},
	updateQuote: async (parent, {id, name, option}, ctx) => {
		const [quote] = await ctx.db
			.user({id: getUserId(ctx)})
			.company()
			.customers()
			.quotes({where: {id}})
			.$fragment(gql`
			fragment QuoteWithOption on Quote {
				id
				options {
					id
				}
			}
		`);

		if (option) {
			await ctx.db.updateOption({
				where: {id: quote.options[0].id},
				update: option,
			});
		}

		return ctx.db.updateQuote({
			where: {id},
			data: {name},
		});
	},
	removeQuote: async (parent, {id}, ctx) => {
		const [quote] = await ctx.db.quotes({
			where: {
				id,
				customer: {
					serviceCompany: {
						owner: {
							id: getUserId(ctx),
						},
					},
				},
			},
		});

		if (!quote) {
			throw new NotFoundError(`Quote '${id}' has not been found.`);
		}

		if (quote.status !== 'DRAFT') {
			throw new Error('Deleting an already accepted quote is not possible');
		}

		return ctx.db.deleteQuote({id});
	},
	// addOption: async (parent, { quoteId, name, sections }, ctx) => {
	//   const quote = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quote({ id: quoteId });

	//   return ctx.db.createOption({
	//     quote: { connect: { id: quoteId } },
	//       name,
	//       sections: { create: sections },
	//   });
	// },
	updateOption: (parent, {id, proposal}, ctx) => ctx.db.updateOption({
		where: {id},
		data: {proposal},
	}),
	// removeOption: async (parent, { id }, ctx) => {
	//   const option = await ctx.db.user({ id: getUserId(ctx) }).company().customers().quotes().options({ where: { id } });

	//   return ctx.db.deleteOption({
	//     id,
	//   });
	// },
	addSection: async (parent, {
		optionId, projectId, name, items = [],
	}, ctx) => {
		if (projectId && optionId) {
			throw new Error('You can define only optionId or projectId');
		}

		let variables = {};

		if (projectId) {
			const [project] = await ctx.db.projects({
				where: {
					id: projectId,
					customer: {
						serviceCompany: {
							owner: {
								id: getUserId(ctx),
							},
						},
					},
				},
			});

			if (!project) {
				throw new NotFoundError(`Project '${projectId}' has not been found.`);
			}

			variables = {
				project: {connect: {id: projectId}},
			};
		}
		else if (optionId) {
			const [option] = await ctx.db.options({
				where: {
					id: optionId,
					quote: {
						customer: {
							serviceCompany: {
								owner: {
									id: getUserId(ctx),
								},
							},
						},
					},
				},
			});

			if (!option) {
				throw new NotFoundError(`Option '${optionId}' has not been found.`);
			}

			variables = {
				option: {connect: {id: optionId}},
			};
		}

		return ctx.db.createSection({
			...variables,
			name,
			items: {create: items},
		});
	},
	updateSection: async (parent, {id, name}, ctx) => {
		const [section] = await ctx.db.sections({
			where: {
				id,
				OR: [
					{
						option: {
							quote: {
								customer: {
									serviceCompany: {
										owner: {
											id: getUserId(ctx),
										},
									},
								},
							},
						},
					},
					{
						project: {
							customer: {
								serviceCompany: {
									owner: {
										id: getUserId(ctx),
									},
								},
							},
						},
					},
				],
			},
		});

		if (!section) {
			throw new NotFoundError(`Section '${id}' has not been found.`);
		}

		return ctx.db.updateSection({
			where: {id},
			data: {name},
		});
	},
	removeSection: async (parent, {id}, ctx) => {
		const [section] = await ctx.db.sections({
			where: {
				id,
				OR: [
					{
						option: {
							quote: {
								customer: {
									serviceCompany: {
										owner: {
											id: getUserId(ctx),
										},
									},
								},
							},
						},
					},
					{
						project: {
							customer: {
								serviceCompany: {
									owner: {
										id: getUserId(ctx),
									},
								},
							},
						},
					},
				],
			},
		});

		if (!section) {
			throw new NotFoundError(`Section '${id}' has not been found.`);
		}

		return ctx.db.deleteSection({id});
	},
	addItem: async (
		parent,
		{
			sectionId, name, description, unitPrice, unit, vatRate,
		},
		ctx,
	) => {
		const [section] = await ctx.db.sections({
			where: {
				id: sectionId,
				OR: [
					{
						option: {
							quote: {
								customer: {
									serviceCompany: {
										owner: {id: getUserId(ctx)},
									},
								},
							},
						},
					},
					{
						project: {
							customer: {
								serviceCompany: {
									owner: {id: getUserId(ctx)},
								},
							},
						},
					},
				],
			},
		}).$fragment(gql`
			fragment SectionWithQuoteAndProject on Section {
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
				project {
					status
				}
			}
		`);

		if (!section) {
			throw new NotFoundError(
				`No section with id '${sectionId}' has been found`,
			);
		}

		// PROJECT

		if (section.project) {
			if (section.project.status === 'FINISHED') {
				throw new Error('Item cannot be added in this project state.');
			}

			return ctx.db.createItem({
				section: {connect: {id: sectionId}},
				name,
				status: 'PENDING',
				description,
				unit,
			});
		}

		// QUOTE

		if (section.option.quote.status === 'SENT') {
			throw new Error('Item cannot be added in this quote state.');
		}

		const {
			defaultDailyPrice,
			defaultVatRate,
		} = section.option.quote.customer.serviceCompany.owner;

		return ctx.db.createItem({
			section: {
				connect: {id: sectionId},
			},
			name,
			status: section.option.quote.status === 'ACCEPTED' ? 'ADDED' : 'PENDING',
			description,
			unitPrice: unitPrice || defaultDailyPrice,
			unit,
			vatRate: vatRate || defaultVatRate,
		});
	},
	updateItem: async (
		parent,
		{
			id, name, description, unitPrice, unit, vatRate,
		},
		ctx,
	) => {
		const [item] = await ctx.db.items({
			where: {
				id,
				OR: [
					{
						section: {
							option: {
								quote: {
									customer: {
										serviceCompany: {
											owner: {id: getUserId(ctx)},
										},
									},
								},
							},
						},
					},
					{
						section: {
							project: {
								customer: {
									serviceCompany: {
										owner: {id: getUserId(ctx)},
									},
								},
							},
						},
					},
				],
			},
		}).$fragment(gql`
			fragment ItemWithQuoteAndProject on Item {
				status
				section {
					option {
						quote {
							status
						}
					}
					project {
						status
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		// PROJECT

		if (item.section.project) {
			if (item.section.project.status !== 'DRAFT') {
				throw new Error(
					`Item '${id}' cannot be updated in this project state.`,
				);
			}

			return ctx.db.updateItem({
				where: {id},
				data: {
					name,
					description,
					unit,
					status: 'PENDING',
				},
			});
		}

		// QUOTE

		if (item.section.option.quote.status !== 'DRAFT') {
			throw new Error(`Item '${id}' cannot be updated in this quote state.`);
		}

		return ctx.db.updateItem({
			where: {id},
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
	updateValidatedItem: async (parent, {id, unit, comment}, ctx) => {
		const userId = getUserId(ctx);
		const items = await ctx.db
			.user({id: userId})
			.company()
			.customers()
			.quotes()
			.options()
			.sections()
			.items({where: {id}});

		if (!items.length) {
			throw new NotFoundError(`No item with id '${id}' has been found`);
		}

		const item = await ctx.db.item({id}).$fragment(gql`
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

		if (item.status === 'FINISHED') {
			throw new Error(`Item '${id}' cannot be updated in this state.`);
		}

		const result = await ctx.db.updateItem({
			where: {id},
			data: {
				pendingUnit: unit,
				status: item.status === 'ADDED' ? 'ADDED' : 'UPDATED',
				comments: {
					create: {
						text: comment.text,
						authorUser: {
							connect: {id: userId},
						},
						views: {
							create: {
								user: {
									connect: {id: userId},
								},
							},
						},
					},
				},
			},
		});

		sendMetric({metric: 'inyo.item.updated'});

		return result;
	},
	removeItem: async (parent, {id}, ctx) => {
		const [item] = await ctx.db.items({
			where: {
				id,
				OR: [
					{
						section: {
							option: {
								quote: {
									customer: {
										serviceCompany: {
											owner: {id: getUserId(ctx)},
										},
									},
								},
							},
						},
					},
					{
						section: {
							project: {
								customer: {
									serviceCompany: {
										owner: {id: getUserId(ctx)},
									},
								},
							},
						},
					},
				],
			},
		});

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		return ctx.db.deleteItem({id});
	},
	sendQuote: async (parent, {id}, ctx) => {
		const user = await ctx.db.user({id: getUserId(ctx)});
		// todo: verify quote ownership
		const quote = await ctx.db.quote({id}).$fragment(gql`
			fragment QuoteWithCustomer on Quote {
				id
				name
				token
				status
				customer {
					name
					title
					firstName
					lastName
					email
					serviceCompany {
						siret
						name
						address {
							street
							city
							country
						}
					}
				}
			}
		`);

		if (!quote) {
			throw new NotFoundError(`No quote '${id}' has been found`);
		}

		if (quote.status !== 'DRAFT') {
			throw new Error('This quote has already been sent.');
		}

		const {serviceCompany} = quote.customer;

		if (
			!serviceCompany.siret
			|| !serviceCompany.name
			|| !serviceCompany.address.street
			|| !serviceCompany.address.city
			|| !serviceCompany.address.country
		) {
			throw new InsufficientDataError(
				"NEED_MORE_INFOS: can't send quote without company info",
			);
		}

		// sending the quote via sendgrid
		// this use the quote template
		try {
			await sendQuoteEmail({
				email: quote.customer.email,
				customerName: String(
					` ${titleToCivilite[quote.customer.title]} ${
						quote.customer.firstName
					} ${quote.customer.lastName}`,
				).trimRight(),
				projectName: quote.name,
				user: `${user.firstName} ${user.lastName}`,
				quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
			});
			console.log(
				`${new Date().toISOString()}: Quote Email sent to ${
					quote.customer.email
				}`,
			);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Quote Email not sent with error ${error}`,
			);
		}

		try {
			setupQuoteReminderEmail(
				{
					email: quote.customer.email,
					customerName: quote.customer.name,
					projectName: quote.name,
					user: `${user.firstName} ${user.lastName}`,
					issueDate: moment().format(),
					quoteId: quote.id,
					quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
				},
				ctx,
			);
			console.log(`${new Date().toISOString()}: Quote reminder setup finished`);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Quote reminder setup errored with error ${error}`,
			);
		}

		// send mail with token

		sendMetric({metric: 'inyo.quote.sent'});

		return ctx.db.updateQuote({
			where: {id},
			data: {
				status: 'SENT',
				issuedAt: new Date(),
			},
		});
	},
	finishItem: async (parent, {id}, ctx) => {
		const user = await ctx.db.user({id: getUserId(ctx)});
		const [item] = await ctx.db.items({
			where: {
				id,
				OR: [
					{
						section: {
							option: {
								quote: {
									customer: {
										serviceCompany: {
											owner: {id: getUserId(ctx)},
										},
									},
								},
							},
						},
					},
					{
						section: {
							project: {
								customer: {
									serviceCompany: {
										owner: {id: getUserId(ctx)},
									},
								},
							},
						},
					},
				],
			},
		}).$fragment(gql`
			fragment ItemWithQuoteAndProject on Item {
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
								title
								firstName
								lastName
								email
							}
							status
						}
					}
					project {
						id
						token
						name
						customer {
							title
							firstName
							lastName
							email
						}
						status
						sections {
							name
							items {
								name
								unit
								status
							}
						}
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		// PROJECT

		if (item.section.project) {
			const {project} = item.section;

			if (project.status === 'FINISHED' || item.status !== 'PENDING') {
				throw new Error(`Item '${id}' cannot be finished.`);
			}

			const {sections, customer} = project;

			try {
				await sendTaskValidationEmail({
					email: customer.email,
					user: String(`${user.firstName} ${user.lastName}`).trim(),
					customerName: String(
						` ${titleToCivilite[customer.title]} ${customer.firstName} ${
							customer.lastName
						}`,
					).trimRight(),
					projectName: project.name,
					itemName: item.name,
					sections: sections
						.map(section => ({
							name: section.name,
							timeLeft: section.items
								.filter(item => item.status === 'PENDING')
								.reduce((acc, item) => acc + item.unit, 0),
						}))
						.filter(section => section.timeLeft > 0),
					projectUrl: `${inyoQuoteBaseUrl}/${project.id}/view/${project.token}`,
				});
				console.log(`Task validation email sent to ${customer.email}`);
			}
			catch (error) {
				console.log(`Task validation email not because with error ${error}`);
			}
		}

		// QUOTE

		if (
			item.section.option.quote.status !== 'ACCEPTED'
			|| item.status !== 'PENDING'
		) {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, quote} = item.section.option;
		const {customer} = quote;

		try {
			await sendTaskValidationEmail({
				email: customer.email,
				user: String(`${user.firstName} ${user.lastName}`).trim(),
				customerName: String(
					` ${titleToCivilite[quote.customer.title]} ${
						quote.customer.firstName
					} ${quote.customer.lastName}`,
				).trimRight(),
				projectName: quote.name,
				itemName: item.name,
				sections: sections
					.map(section => ({
						name: section.name,
						timeLeft: section.items
							.filter(item => item.status === 'PENDING')
							.reduce((acc, item) => acc + item.unit, 0),
					}))
					.filter(section => section.timeLeft > 0),
				quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
			});
			console.log(`Task validation email sent to ${customer.email}`);
		}
		catch (error) {
			console.log(`Task validation email not because with error ${error}`);
		}

		sendMetric({metric: 'inyo.item.validated'});

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'FINISHED',
			},
		});
	},
	sendAmendment: async (parent, {quoteId}, ctx) => {
		const user = await ctx.db.user({id: getUserId(ctx)});
		const quote = await ctx.db.quote({id: quoteId}).$fragment(gql`
			fragment quoteWithItems on Quote {
				id
				token
				status
				customer {
					email
					title
					firstName
					lastName
				}
				options {
					sections {
						items(where: {OR: [{status: ADDED}, {status: UPDATED}]}) {
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
		`);

		if (!quote) {
			throw new NotFoundError(`No quote with id '${quoteId}' has been found`);
		}

		if (quote.status !== 'ACCEPTED') {
			throw new Error(
				`An amendment for quote '${quoteId}' can't be sent in this state.`,
			);
		}

		const items = quote.options.reduce(
			(ids, option) => ids.concat(
				option.sections.reduce(
					(ids, section) => ids.concat(
						section.items.map(item => ({
							...item,
							// This return the last comment made on the item
							comment: item.comments
								.map(comment => ({
									...comment,
									author: item.authorUser || item.authorCustomer,
								}))
								.slice(-1)[0],
						})),
					),
					[],
				),
			),
			[],
		);

		await ctx.db.updateManyItems({
			where: {
				id_in: items
					.filter(item => item.status === 'ADDED')
					.map(item => item.id),
			},
			data: {
				status: 'ADDED_SENT',
			},
		});

		await ctx.db.updateManyItems({
			where: {
				id_in: items
					.filter(item => item.status === 'UPDATED')
					.map(item => item.id),
			},
			data: {
				status: 'UPDATED_SENT',
			},
		});

		sendMetric({metric: 'inyo.item.updated_sent', count: items.length});

		try {
			await sendAmendmentEmail({
				email: quote.customer.email,
				user: String(`${user.firstName} ${user.lastName}`).trim(),
				customerName: String(
					` ${titleToCivilite[quote.customer.title]} ${
						quote.customer.firstName
					} ${quote.customer.lastName}`,
				).trimRight(),
				projectName: quote.name,
				quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`,
				items,
			});
			console.log(
				`${new Date().toISOString()}: Amendment Email sent to ${
					quote.customer.email
				}`,
			);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Amendment Email not sent with error ${error}`,
			);
		}

		try {
			await setupAmendmentReminderEmail(
				{
					email: quote.customer.email,
					user: String(`${user.firstName} ${user.lastName}`).trim(),
					customerName: String(
						` ${titleToCivilite[quote.customer.title]} ${
							quote.customer.firstName
						} ${quote.customer.lastName}`,
					).trimRight(),
					projectName: quote.name,
					quoteUrl: `${inyoQuoteBaseUrl}${quote.id}?token=${quote.token}`,
					quoteId: quote.id,
					items,
				},
				ctx,
			);
			console.log(
				`${new Date().toISOString()}: Amendment reminder setup finished with id`,
			);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Amendment reminder not setup with error ${error}`,
			);
		}

		sendMetric({metric: 'inyo.amendment.sent'});

		return ctx.db.quote({id: quoteId});
	},
	acceptItem: async (parent, {id, token}, ctx) => {
		const [item] = await ctx.db.items({
			where: {
				id,
				section: {
					OR: [{option: {quote: {token}}}, {project: {token}}],
				},
			},
		}).$fragment(gql`
			fragment ItemWithQuoteAndProject on Item {
				status
				pendingUnit
				section {
					option {
						quote {
							status
							reminders(where: {status: PENDING}) {
								id
								postHookId
							}
						}
					}
					project {
						status
						# reminders(where: {status: PENDING}) {
						# 	id
						# 	postHookId
						# }
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		const {project, option: {quote} = {}} = item.section;
		let reminders = [];

		// PROJECT
		if (project) {
			if (project.status !== 'ONGOING') {
				throw new Error(
					`Item '${id}' cannot be accepted in this project state.`,
				);
			}

			// ({reminders} = project);
		}
		// QUOTE
		else if (quote) {
			if (quote.status !== 'ACCEPTED') {
				throw new Error(`Item '${id}' cannot be updated in this quote state.`);
			}

			({reminders} = quote);
		}

		reminders.forEach(async (reminder) => {
			try {
				await cancelReminder(reminder.postHookId);
				await ctx.db.updateReminder({
					where: {id: reminder.id},
					data: {
						status: 'CANCELED',
					},
				});
				console.log(`Reminder with id ${reminder.id} canceled`);
			}
			catch (error) {
				console.log(
					`Reminder with id ${reminder.id} not canceled with error`,
					error,
				);
			}
		});

		let result;

		if (item.status === 'ADDED_SENT') {
			result = await ctx.db.updateItem({
				where: {id},
				data: {status: 'PENDING'},
			});
		}
		else if (item.status === 'UPDATED_SENT') {
			result = await ctx.db.updateItem({
				where: {id},
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
	rejectItem: async (parent, {id, token}, ctx) => {
		const [item] = await ctx.db.items({
			where: {
				id,
				section: {
					OR: [{option: {quote: {token}}}, {project: {token}}],
				},
			},
		}).$fragment(gql`
			fragment ItemWithQuoteAndProject on Item {
				status
				pendingUnit
				section {
					option {
						quote {
							status
						}
					}
					project {
						status
					}
				}
			}
		`);

		// PROJECT
		if (item.section.project && item.section.project.status !== 'ONGOING') {
			throw new Error(`Item '${id}' cannot be updated in this project state.`);
		}
		// QUOTE
		else if (item.section.option.quote.status !== 'ACCEPTED') {
			throw new Error(`Item '${id}' cannot be updated in this quote state.`);
		}

		if (item.status === 'ADDED_SENT') {
			return ctx.db.deleteItem({id});
		}
		if (item.status === 'UPDATED_SENT') {
			return ctx.db.updateItem({
				where: {id},
				data: {
					status: 'PENDING',
					pendingUnit: null,
				},
			});
		}
		throw new Error(`Item '${id}' cannot be updated in this state.`);
	},
	acceptQuote: async (parent, {id, token}, ctx) => {
		const [quote] = await ctx.db.quotes({where: {id, token}}).$fragment(gql`
			fragment CustomerUserWithQuote on Quote {
				status
				id
				name
				reminders(where: {status: PENDING}) {
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
					title
					firstName
					lastName
				}
			}
		`);

		if (!quote || quote.status !== 'SENT') {
			throw new NotFoundError(`No quote with id '${id}' has been found`);
		}

		const result = await ctx.db.updateQuote({
			where: {id},
			data: {
				status: 'ACCEPTED',
				acceptedQuotesLogs: {
					create: {ip: ctx.ip},
				},
			},
		});

		quote.reminders.forEach(async (reminder) => {
			try {
				await cancelReminder(reminder.postHookId);
				await ctx.db.updateReminder({
					where: {id: reminder.id},
					data: {
						status: 'CANCELED',
					},
				});
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} canceled`,
				);
			}
			catch (error) {
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} not canceled with error ${error}`,
				);
			}
		});

		const user = quote.customer.serviceCompany.owner;

		try {
			await sendAcceptedQuoteEmail({
				email: user.email,
				user: `${user.firstName} ${user.lastName}`,
				customerName: String(
					` ${titleToCivilite[quote.customer.title]} ${
						quote.customer.firstName
					} ${quote.customer.lastName}`,
				).trimRight(),
				projectName: quote.name,
				quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/see`,
				firstTask: quote.options[0].sections[0].items[0].name,
			});

			console.log(
				`${new Date().toISOString()}: Acceptance quote email sent to ${
					user.email
				}`,
			);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Acceptance quote email not sent with error ${error}`,
			);
		}

		sendMetric({metric: 'inyo.quote.accepted'});

		return result;
	},
	rejectQuote: async (parent, {id, token}, ctx) => {
		const [quote] = await ctx.db.quotes({where: {id, token}}).$fragment(gql`
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
					title
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
		});

		const user = quote.customer.serviceCompany.owner;

		try {
			await sendRejectedQuoteEmail({
				email: user.email,
				user: `${user.firstName} ${user.lastName}`,
				customerName: String(
					` ${titleToCivilite[quote.customer.title]} ${
						quote.customer.firstName
					} ${quote.customer.lastName}`,
				).trimRight(),
				projectName: quote.name,
				quoteUrl: `${inyoQuoteBaseUrl}/${quote.id}/see`,
			});

			console.log(
				`${new Date().toISOString()}: Rejection quote email sent to ${
					user.owner.email
				}`,
			);
		}
		catch (error) {
			console.log(
				`${new Date().toISOString()}: Rejection quote email not sent with error ${error}`,
			);
		}

		sendMetric({metric: 'inyo.quote.rejected'});
		return result;
	},
	acceptAmendment: async (parent, {quoteId, token}, ctx) => {
		const [quote] = await ctx.db.quotes({where: {id: quoteId, token}})
			.$fragment(gql`
			fragment quoteWithItem on Quote {
				status
				reminders(where: {status: PENDING}) {
					id
					postHookId
				}
				options {
					sections {
						items(where: {OR: [{status: UPDATED_SENT}, {status: ADDED_SENT}]}) {
							id
							pendingUnit
						}
					}
				}
			}
		`);

		if (!quote) {
			throw new NotFoundError(`Quote '${quoteId}' has not been found.`);
		}

		if (quote.status !== 'ACCEPTED') {
			throw new Error(`Quote '${quoteId}' cannot be updated in this state.`);
		}

		const items = quote.options.reduce(
			(ids, option) => ids.concat(
				option.sections.reduce(
					(ids, section) => ids.concat(
						section.items.map(item => ({
							id: item.id,
							pendingUnit: item.pendingUnit,
						})),
					),
					[],
				),
			),
			[],
		);

		quote.reminders.forEach(async (reminder) => {
			try {
				await cancelReminder(reminder.postHookId);
				await ctx.db.updateReminder({
					where: {id: reminder.id},
					data: {
						status: 'CANCELED',
					},
				});
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} canceled`,
				);
			}
			catch (error) {
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} not canceled with error ${error}`,
				);
			}
		});

		await Promise.all(
			items.map(async (item) => {
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
			}),
		);

		ctx.db.createLog({
			ip: ctx.ip,
			acceptedAmendment: {
				connect: {id: quote.id},
			},
		});

		return ctx.db.quote({id: quoteId});
	},
	rejectAmendment: async (parent, {quoteId, token}, ctx) => {
		const [quote] = await ctx.db.quotes({where: {id: quoteId, token}})
			.$fragment(gql`
			fragment quoteWithItem on Quote {
				status
				reminders(where: {status: PENDING}) {
					id
					postHookId
				}
				options {
					sections {
						items(where: {OR: [{status: UPDATED_SENT}, {status: ADDED_SENT}]}) {
							id
						}
					}
				}
			}
		`);

		const itemIds = quote.options.reduce(
			(ids, option) => ids.concat(
				option.sections.reduce(
					(ids, section) => ids.concat(section.items.map(item => item.id)),
					[],
				),
			),
			[],
		);

		if (!quote) {
			throw new NotFoundError(`Quote '${quoteId}' has not been found.`);
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
					},
				});
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} canceled`,
				);
			}
			catch (error) {
				console.log(
					`${new Date().toISOString()}: reminder with id ${
						reminder.id
					} not canceled with error ${error}`,
				);
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

		return ctx.db.quote({id: quoteId});
	},
	postComment: async (parent, {itemId, token, comment}, ctx) => {
		if (token) {
			const [item] = await ctx.db.items({
				where: {
					id: itemId,
					section: {
						OR: [{option: {quote: {token}}}, {project: {token}}],
					},
				},
			}).$fragment(gql`
				fragment ItemAndAuthorsForUser on Item {
					id
					name
					section {
						option {
							quote {
								id
								name
								token
								customer {
									id
									firstName
									lastName
									email
									serviceCompany {
										owner {
											email
										}
									}
								}
							}
						}
						project {
							id
							name
							token
							customer {
								id
								firstName
								lastName
								email
								serviceCompany {
									owner {
										email
									}
								}
							}
						}
					}
				}
			`);

			if (!item) {
				throw new NotFoundError(`Item '${itemId}' has not been found`);
			}

			const {project, option: {quote} = {}} = item.section;
			let customer;

			if (project) {
				({customer} = project);
			}
			else {
				({customer} = quote);
			}

			const user = customer.serviceCompany.owner;

			const result = ctx.db.updateItem({
				where: {id: itemId},
				data: {
					comments: {
						create: {
							text: comment.text,
							authorCustomer: {
								connect: {id: customer.id},
							},
							views: {
								create: {
									customer: {
										connect: {id: customer.id},
									},
								},
							},
						},
					},
				},
			});

			try {
				await sendNewCommentEmail({
					email: user.email,
					recipentName: String(`${user.firstName} ${user.lastName}`).trim(),
					authorName: String(
						`${customer.firstName} ${customer.lastName}`,
					).trim(),
					projectName: project ? project.name : quote.name,
					itemName: item.name,
					comment,
					quoteUrl: quote ? `${inyoQuoteBaseUrl}/${quote.id}/see` : undefined,
					projectUrl: quote
						? `${inyoProjectBaseUrl}/${project.id}/see`
						: undefined,
				});
				console.log(`New comment email sent to ${user.email}`);
			}
			catch (error) {
				console.log(`New comment email not because with error ${error}`);
			}

			sendMetric({metric: 'inyo.comment.postedByCustomer'});

			return result;
		}

		const userId = getUserId(ctx);
		const [item] = await ctx.db.items({
			where: {
				id: itemId,
				section: {
					OR: [
						{
							option: {
								quote: {customer: {serviceCompany: {owner: {id: userId}}}},
							},
							project: {customer: {serviceCompany: {owner: {id: userId}}}},
						},
					],
				},
			},
		}).$fragment(gql`
			fragment ItemAndAuthorsForCustomer on Item {
				id
				name
				section {
					option {
						quote {
							id
							name
							token
							customer {
								id
								firstName
								lastName
								email
								serviceCompany {
									owner {
										firstName
										lastName
										email
									}
								}
							}
						}
					}
					project {
						id
						name
						token
						customer {
							id
							firstName
							lastName
							email
							serviceCompany {
								owner {
									firstName
									lastName
									email
								}
							}
						}
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${itemId}' has not been found.`);
		}

		const {project, option: {quote} = {}} = item.section;
		let customer;

		if (project) {
			({customer} = project);
		}
		else {
			({customer} = quote);
		}

		const user = customer.serviceCompany.owner;

		const result = ctx.db.updateItem({
			where: {id: itemId},
			data: {
				comments: {
					create: {
						text: comment.text,
						authorUser: {
							connect: {id: userId},
						},
						views: {
							create: {
								user: {
									connect: {id: userId},
								},
							},
						},
					},
				},
			},
		});

		try {
			await sendNewCommentEmail({
				email: customer.email,
				recipentName: String(
					`${customer.firstName} ${customer.lastName}`,
				).trim(),
				authorName: String(`${user.firstName} ${user.lastName}`).trim(),
				projectName: project ? project.name : quote.name,
				itemName: item.name,
				comment,
				quoteUrl: quote
					? `${inyoQuoteBaseUrl}/${quote.id}/view/${quote.token}`
					: undefined,
				projectUrl: quote
					? `${inyoQuoteBaseUrl}/${project.id}/view/${project.token}`
					: undefined,
			});
			console.log(`New comment email sent to ${customer.email}`);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		sendMetric({metric: 'inyo.comment.postedByUser'});

		return result;
	},
};

module.exports = {
	Mutation,
};
