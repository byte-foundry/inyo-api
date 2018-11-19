const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
const {sendTaskValidationEmail} = require('../emails/TaskEmail');

const inyoQuoteBaseUrl = 'https://app.inyo.me/app/quotes';
const inyoProjectBaseUrl = 'https://app.inyo.me/app/projects';

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const finishItem = async (parent, {id, token}, ctx) => {
	const fragment = gql`
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
							reviewer
						}
					}
				}
			}
		}
	`;

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
				projectUrl: `${inyoQuoteBaseUrl}/${project.id}/view/${project.token}`,
			});
			console.log(`Task validation email sent to ${user.email}`);
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
