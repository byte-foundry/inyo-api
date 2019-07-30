const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const cancelRequestCollab = async (parent, {collabRequestId}, ctx) => {
	const [collabRequest] = await ctx.db.collabRequests({
		where: {
			id: collabRequestId,
			requester: {
				id: getUserId(ctx),
			},
		},
	});

	if (!collabRequest) {
		throw new NotFoundError(`Collab request ${collabRequestId} does not exist`);
	}

	return ctx.db.updateCollabRequest({
		where: {id: collabRequestId},
		data: {
			status: 'CANCELED',
		},
	});
};

module.exports = {
	cancelRequestCollab,
};
