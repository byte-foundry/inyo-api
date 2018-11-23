const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendItemUpdatedEmail} = require('../emails/TaskEmail');

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const updateItem = async (
	parent,
	{
		id,
		name,
		description,
		unitPrice,
		unit,
		vatRate,
		reviewer,
		comment,
		notifyCustomer = true,
	},
	ctx,
) => {
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
			status
			section {
				option {
					quote {
						status
					}
				}
				project {
					status
					customer {
						title
						firstName
						lastName
						email
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

		if (project.status === 'FINISHED') {
			throw new Error(
				`Item '${id}' cannot be updated when the project is finished.`,
			);
		}

		const updatedItem = await ctx.db.updateItem({
			where: {id},
			data: {
				name,
				description,
				unit,
				status: 'PENDING',
				reviewer,
				comments: {
					create: comment && {
						text: comment.text,
						authorUser: {
							connect: {id: user.id},
						},
						views: {
							create: {
								user: {
									connect: {id: user.id},
								},
							},
						},
					},
				},
			},
		});

		if (!notifyCustomer) {
			const {customer} = project;

			sendItemUpdatedEmail({
				email: customer.email,
				recipentName: `${titleToCivilite[customer.title]} ${
					customer.lastName
				} ${customer.firstName}`.trim(),
				authorName: `${user.firstName} ${user.lastName}`.trim(),
				projectName: project.name,
				itemName: item.name,
				comment,
			});
		}

		return updatedItem;
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
};

module.exports = {
	updateItem,
};
