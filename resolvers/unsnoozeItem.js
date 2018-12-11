const {NotFoundError} = require('../errors');
const {getUserId} = require('../utils');

const unsnoozeItem = async (root, {id}, ctx) => {
	const [item] = await ctx.db.items({
		where: {
			id,
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
	});

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.status !== 'SNOOZED') {
		throw new Error('Only snoozed items can be unsnoozed.');
	}

	return ctx.db.updateItem({
		where: {id},
		data: {status: 'PENDING'},
	});
};

module.exports = {
	unsnoozeItem,
};
