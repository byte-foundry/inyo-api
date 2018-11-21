const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const addItem = async (
	parent,
	{
		sectionId, name, description, unitPrice, unit, vatRate, reviewer,
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
		throw new NotFoundError(`No section with id '${sectionId}' has been found`);
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
			reviewer,
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
};

module.exports = {
	addItem,
};
