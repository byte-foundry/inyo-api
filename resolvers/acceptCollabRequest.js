const gql = String.raw;

const {getUserId, formatName} = require('../utils');
const {NotFoundError, AuthError, AlreadyExistingError} = require('../errors');
const {sendAcceptCollabEmail} = require('../emails/CollabEmail');

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

	const requestee = await ctx.db.updateUser({
		where: {
			id: getUserId(ctx),
		},
		data: {
			collaborators: {connect: {id: request.requester.id}},
		},
	});

	const requester = await ctx.db.updateUser({
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

	await ctx.db.createUserEvent({
		type: 'COLLAB_ACCEPTED',
		user: {connect: {id: request.requestee.id}},
		metadata: {
			userId: request.requestee.id,
		},
		notifications: {
			create: {
				user: {connect: {id: request.requester.id}},
			},
		},
	});

	// Send email
	try {
		sendAcceptCollabEmail(
			{
				email: requester.email,
				meta: {userId: requester.id},
				requesterName: formatName(requester.firstName, requester.lastName),
				user: formatName(requestee.firstName, requestee.lastName),
			},
			ctx,
		);

		console.log(`Accept collab email sent to ${requester.email}`);
	}
	catch (error) {
		console.log('Accept collab email not sent', error);
	}

	return updatedRequest;
};

module.exports = {
	acceptCollabRequest,
};
