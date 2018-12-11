const {NotFoundError} = require('../errors');
const {getUserId} = require('../utils');

const snoozeItem = async (root, {id}, ctx) => {
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

	if (item.status !== 'PENDING') {
		throw new Error('Only pending items can be snoozed.');
	}

	return ctx.db.updateItem({
		where: {id},
		data: {status: 'SNOOZED'},
	});
};

module.exports = {
	snoozeItem,
};
