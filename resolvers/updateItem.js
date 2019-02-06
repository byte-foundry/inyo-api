const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const reorderSection = async (
	section,
	initialPosition,
	wantedPosition,
	ctx,
) => {
	const itemsToUpdate
		= wantedPosition > initialPosition
			? section.items.slice(initialPosition + 1, wantedPosition + 1)
			: section.items.slice(wantedPosition, initialPosition);

	const startIndex
		= wantedPosition > initialPosition ? initialPosition : wantedPosition + 1;

	await Promise.all(
		itemsToUpdate.map((sectionItem, index) => ctx.db.updateItem({
			where: {id: sectionItem.id},
			data: {position: startIndex + index},
		})),
	);
};

const updateItem = async (
	parent,
	{
		id,
		sectionId,
		name,
		type,
		description,
		unitPrice,
		unit,
		vatRate,
		reviewer,
		comment,
		position: wantedPosition,
		token,
	},
	ctx,
) => {
	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id,
				section: {
					project: {
						token,
					},
				},
			},
		});

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		// TODO: additional check

		if (!description) {
			throw new Error('A customer can only update files.');
		}

		return ctx.db.updateItem({
			where: {id},
			data: {description},
		});
	}

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
			id
			status
			position
			section {
				id
				items(orderBy: position_ASC) {
					id
					position
				}
				option {
					quote {
						status
					}
				}
				project {
					id
					status
					sections(orderBy: position_ASC, where: {id: "${sectionId}"}) {
						id
						items(orderBy: position_ASC) {
							id
						}
					}
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

		let position = wantedPosition;
		let initialPosition = item.section.items.findIndex(
			sectionItem => sectionItem.id === item.id,
		);

		if (initialPosition === -1) {
			throw new Error(
				`Item '${item.id}' has not been found in Section '${
					item.section.id
				}' items.`,
			);
		}

		let wantedSection = item.section;

		if (sectionId && sectionId !== item.section.id) {
			[wantedSection] = project.sections;

			if (!wantedSection) {
				throw new Error(
					`Item '${id}' cannot be moved into Section '${sectionId}', it has not been found in the project.`,
				);
			}

			// if we change section, we need to re-order the previous one
			// putting it at the end of the section first
			await reorderSection(
				item.section,
				initialPosition,
				item.section.items.length,
				ctx,
			);

			initialPosition = wantedSection.items.length;
		}

		if (
			(typeof wantedPosition === 'number'
				&& wantedPosition !== initialPosition)
			|| (sectionId && sectionId !== item.section.id)
		) {
			if (wantedPosition < 0) {
				position = 0;
			}
			else if (wantedPosition > wantedSection.items.length) {
				position = wantedSection.items.length;
			}
			else {
				position = wantedPosition;
			}

			reorderSection(wantedSection, initialPosition, wantedPosition, ctx);
		}

		const updatedItem = await ctx.db.updateItem({
			where: {id},
			data: {
				section: sectionId && {connect: {id: wantedSection.id}},
				name,
				type,
				description,
				unit,
				reviewer,
				position,
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
