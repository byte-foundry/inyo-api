const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AuthError, AlreadyExistingError} = require('../errors');

const rejectCollabRequest = async (parent, {requestId}, ctx) => {
	// reject collab request
	const request = await ctx.db.collabRequest({
		id: requestId,
	}).$fragment(gql`
		fragment CollabRequest on CollabRequest {
			id
			status
			requestee {
				id
			}
		}
	`);

	if (!request) {
		throw new NotFoundError(`Request with id ${requestId} does not exist`);
	}

	if (request.requestee.id !== getUserId(ctx)) {
		throw new AuthError('User is not authorized to reject this request');
	}

	if (request.status === 'REJECTED') {
		throw new AlreadyExistingError('Request is already rejected');
	}

	const updatedRequest = await ctx.db.updateRequest({
		where: {
			id: requestId,
		},
		data: {
			status: 'REJECTED',
			rejectedAt: new Date().toISOString(),
		},
	});

	// send notification

	const collabAcceptedEvent = await ctx.db.createUserEvent({
		type: 'COLLAB_REJECTED',
		user: {connect: {id: request.requestee.id}},
		metadata: {
			userId: request.requestee.id,
		},
	});

	await ctx.db.createNotification({
		userEvent: {connect: {id: collabAcceptedEvent.id}},
		user: {connect: {id: request.requester.id}},
	});

	return updatedRequest;
};

module.exports = {
	rejectCollabRequest,
};
