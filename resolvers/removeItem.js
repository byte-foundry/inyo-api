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
	});

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	return ctx.db.deleteItem({id});
};

module.exports = {
	removeItem,
};
