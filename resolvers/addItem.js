const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const addItem = async (
	parent,
	{
		sectionId,
		name,
		type,
		description,
		unitPrice,
		unit,
		vatRate,
		reviewer,
		position: wantedPosition,
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
			items(orderBy: position_ASC) {
				id
				position
			}
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

		// default position: end of the list
		let position = section.items.length;

		if (wantedPosition) {
			const wantedPositionItemIndex = section.items.findIndex(
				item => item.position === wantedPosition,
			);

			if (wantedPositionItemIndex !== -1) {
				position = wantedPosition;

				// updating all the positions from the item position
				await Promise.all(
					section.items.slice(position).map((item, index) => ctx.db.updateItem({
						where: {id: item.id},
						data: {position: position + index + 1},
					})),
				);
			}
		}

		return ctx.db.createItem({
			section: {connect: {id: sectionId}},
			name,
			type,
			status: 'PENDING',
			reviewer,
			description,
			unit,
			position,
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
