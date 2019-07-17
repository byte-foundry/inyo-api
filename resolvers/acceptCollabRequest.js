const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AuthError, AlreadyExistingError} = require('../errors');

const acceptCollabRequest = async (parent, {requestId}, ctx) => {
	// accept collab request
	const request = await ctx.db.collabRequest({
		id: requestId,
	}).$fragment(gql`
		fragment CollabRequest on CollabRequest {
			id
			status
			requestee {
				id
			}
			requester {
				id
			}
		}
	`);

	if (!request) {
		throw new NotFoundError(`Request with id ${requestId} does not exist`);
	}

	if (request.requestee.id !== getUserId(ctx)) {
		throw new AuthError('User is not authorized to accept this request');
	}

	if (request.status === 'ACCEPTED') {
		throw new AlreadyExistingError('Request is already accepted');
	}

	await ctx.db.updateUser({
		where: {
			id: getUserId(ctx),
		},
		data: {
			collaborators: {connect: {id: request.requester.id}},
		},
	});

	await ctx.db.updateUser({
		where: {
			id: request.requester.id,
		},
		data: {
			collaborators: {connect: {id: getUserId(ctx)}},
		},
	});

	const updatedRequest = await ctx.db.updateCollabRequest({
		where: {
			id: requestId,
		},
		data: {
			status: 'ACCEPTED',
			acceptedAt: new Date().toISOString(),
		},
	});

	// send notification

	const collabAcceptedEvent = await ctx.db.createUserEvent({
		type: 'COLLAB_ACCEPTED',
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
	acceptCollabRequest,
};
