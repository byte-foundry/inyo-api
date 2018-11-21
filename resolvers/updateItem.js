const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateItem = async (
	parent,
	{
		id, name, description, unitPrice, unit, vatRate, reviewer,
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
			throw new Error(`Item '${id}' cannot be updated in this project state.`);
		}

		return ctx.db.updateItem({
			where: {id},
			data: {
				name,
				description,
				unit,
				status: 'PENDING',
				reviewer,
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
};

module.exports = {
	updateItem,
};
