const gql = String.raw;

const {getUserId, formatName} = require('../utils');
const {NotFoundError, AuthError, AlreadyExistingError} = require('../errors');
const {sendRejectCollabEmail} = require('../emails/CollabEmail');

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
				email
				firstName
				lastName
			}
			requester {
				id
				email
				firstName
				lastName
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

	const updatedRequest = await ctx.db.updateCollabRequest({
		where: {
			id: requestId,
		},
		data: {
			status: 'REJECTED',
			rejectedAt: new Date().toISOString(),
		},
	});

	// send notification

	await ctx.db.createUserEvent({
		type: 'COLLAB_REJECTED',
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
		sendRejectCollabEmail(
			{
				email: request.requester.email,
				meta: {userId: request.requester.id},
				requesterName: formatName(
					request.requester.firstName,
					request.requester.lastName,
				),
				user: formatName(
					request.requestee.firstName,
					request.requestee.lastName,
				),
			},
			ctx,
		);

		console.log(`Reject Collab email sent to ${request.requestee.email}`);
	}
	catch (error) {
		console.log('Reject Collab email not sent', error);
	}

	return updatedRequest;
};

module.exports = {
	rejectCollabRequest,
};
