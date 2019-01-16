const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeItem = async (parent, {id}, ctx) => {
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
		fragment ItemWithSectionItems on Item {
			id
			status
			section {
				project {
					status
				}
				items(orderBy: position_ASC) {
					id
					position
				}
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (
		item.section.project.status === 'FINISHED'
		|| item.status === 'FINISHED'
	) {
		throw new Error(`Item '${id}' can't be removed in this state.`);
	}

	const itemIndex = item.section.items.findIndex(
		sectionItem => item.id === sectionItem.id,
	);

	const removedItem = await ctx.db.deleteItem({id});

	// updating all the positions from the item position
	await Promise.all(
		item.section.items.slice(itemIndex + 1).map((sectionItem, index) => ctx.db.updateItem({
			where: {id: sectionItem.id},
			data: {position: itemIndex + index},
		})),
	);

	return removedItem;
};

module.exports = {
	removeItem,
};
