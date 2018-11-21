const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');

const updateItem = async (
	parent,
	{
		id, name, description, unitPrice, unit, vatRate, reviewer, comment,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
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
		if (item.section.project.status === 'FINISHED') {
			throw new Error(
				`Item '${id}' cannot be updated when the project is finished.`,
			);
		}

		if (item.section.project.status === 'ONGOING' && !comment) {
			throw new InsufficientDataError(
				`Item '${id}' needs a comment to explain the changes.`,
			);
		}

		return ctx.db.updateItem({
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
