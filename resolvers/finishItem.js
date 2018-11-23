const gql = String.raw;

const {getUserId, getAppUrl} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
const {
	legacy_sendTaskValidationEmail, // eslint-disable-line
	sendTaskValidationEmail,
	sendTaskValidationWaitCustomerEmail,
} = require('../emails/TaskEmail');

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const finishItem = async (parent, {id, token}, ctx) => {
	const fragment = gql`
		fragment ItemWithQuoteAndProject on Item {
			name
			status
			reviewer
			section {
				id
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
							serviceCompany {
								owner {
									firstName
									lastName
								}
							}
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
						serviceCompany {
							owner {
								firstName
								lastName
							}
						}
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
	`;

	// Customer can finish item only in project
	// PROJECT
	if (token) {
		const [item] = await ctx.db
			.items({
				where: {
					id,
					OR: [
						{section: {option: {quote: {token}}}},
						{section: {project: {token}}},
					],
				},
			})
			.$fragment(fragment);

		if (item.reviewer !== 'CUSTOMER') {
			throw new Error('This item cannot be finished by the customer.');
		}

		const {project} = item.section;

		if (project.status === 'FINISHED' || item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, customer} = project;
		const user = project.customer.serviceCompany.owner;

		try {
			await sendTaskValidationEmail({
				email: user.email,
				user: String(`${customer.firstName} ${customer.lastName}`).trim(),
				customerName: String(` ${user.firstName} ${user.lastName}`).trimRight(),
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
				url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
			});
			console.log(`Task validation email sent to ${user.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}

		sendMetric({metric: 'inyo.item.validated'});

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'FINISHED',
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				id,
				OR: [
					{
						section: {
							option: {
								quote: {
									customer: {
										serviceCompany: {
											owner: {id: userId},
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
										owner: {id: userId},
									},
								},
							},
						},
					},
				],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	// PROJECT

	if (item.section.project) {
		const {project} = item.section;

		if (item.reviewer !== 'USER') {
			throw new Error('This item cannot be finished by the user.');
		}

		if (project.status === 'FINISHED' || item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, customer} = project;
		const user = project.customer.serviceCompany.owner;

		// we ask for the next item in the section
		// or the first item in the next section
		const nextItems = await ctx.db.item({id}).$fragment(gql`
			fragment NextItem on Item {
				section {
					items(after: "${id}", first: 1) {
						id
					}
					project {
						sections(
							after: "${item.section.id}"
							first: 1
							where: { items_some: {} }
						) {
							items(first: 1) {
								id
								name
								description
								reviewer
							}
						}
					}
				}
			}
		`);

		const nextItem
			= nextItems.section.items[0]
			|| (nextItems.section.project.sections[0]
				&& nextItems.section.project.sections[0].items[0]);

		const basicInfo = {
			email: customer.email,
			user: String(`${user.firstName} ${user.lastName}`).trim(),
			customerName: String(
				` ${titleToCivilite[customer.title]} ${customer.firstName} ${
					customer.lastName
				}`,
			).trimRight(),
			projectName: project.name,
			itemName: item.name,
			url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
		};

		try {
			if (nextItem && nextItem.reviewer === 'CUSTOMER') {
				await sendTaskValidationWaitCustomerEmail({
					...basicInfo,
					nextItemName: nextItem.name,
					nextItemDescription: nextItem.description,
				});
			}
			else {
				await sendTaskValidationEmail({
					...basicInfo,
					sections: sections
						.map(section => ({
							name: section.name,
							timeLeft: section.items
								.filter(item => item.status === 'PENDING')
								.reduce((acc, item) => acc + item.unit, 0),
						}))
						.filter(section => section.timeLeft > 0),
				});
			}

			console.log(`Task validation email sent to ${customer.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}
	}
	// QUOTE
	else {
		if (
			item.section.option.quote.status !== 'ACCEPTED'
			|| item.status !== 'PENDING'
		) {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, quote} = item.section.option;
		const {customer} = quote;
		const user = customer.serviceCompany.owner;

		try {
			await legacy_sendTaskValidationEmail({
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
				quoteUrl: getAppUrl(`/quotes/${quote.id}/view/${quote.token}`),
			});
			console.log(`Task validation email sent to ${customer.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}
	}

	sendMetric({metric: 'inyo.item.validated'});

	return ctx.db.updateItem({
		where: {id},
		data: {
			status: 'FINISHED',
		},
	});
};

module.exports = {
	finishItem,
};
