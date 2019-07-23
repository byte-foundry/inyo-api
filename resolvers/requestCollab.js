const gql = String.raw;

const {getUserId, getAppUrl, formatName} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');
const {sendRequestCollabEmail} = require('../emails/CollabEmail');

const requestCollab = async (parent, {userEmail, projectId}, ctx) => {
	// Check requestee exists
	const requestee = await ctx.db.user({
		email: userEmail,
	});

	if (!requestee) {
		throw new NotFoundError(`Requestee ${userEmail} does not exist`);
	}

	// Check collaboration does not already exists
	const user = await ctx.db.user({
		id: getUserId(ctx),
	}).$fragment(gql`
		fragment CollaboratorUser on User {
			id
			email
			firstName
			lastName
			collaborators {
				id
			}
		}
	`);

	if (user.collaborators.some(c => c.email === userEmail)) {
		throw new AlreadyExistingError(
			`Collaboration with ${userEmail} already exists`,
		);
	}

	// Check collaboration is not already REJECTED
	const [collabRequest] = await ctx.db.collabRequests({
		where: {
			requester: {id: getUserId(ctx)},
			requestee: {email: userEmail},
		},
	});

	if (collabRequest) {
		throw new AlreadyExistingError(
			`Collaboration request with ${userEmail} already exists`,
		);
	}

	// Create collaboration
	const newCollabRequest = await ctx.db.createCollabRequest({
		requester: {connect: {id: getUserId(ctx)}},
		requestee: {connect: {email: userEmail}},
		status: 'PENDING',
	});

	// Create Requester user event
	await ctx.db.createUserEvent({
		type: 'COLLAB_REQUESTED',
		user: {connect: {id: getUserId(ctx)}},
		metadata: {
			requesteeEmail: userEmail,
		},
	});

	// Create Requestee user event
	await ctx.db.createUserEvent({
		type: 'COLLAB_ASKED',
		user: {connect: {id: getUserId(ctx)}},
		metadata: {
			collabId: newCollabRequest.id,
		},
		notifications: {
			create: {
				user: {connect: {email: userEmail}},
			},
		},
	});

	// Send email
	try {
		sendRequestCollabEmail(
			{
				email: requestee.email,
				meta: {userId: requestee.id},
				requesteeName: formatName(requestee.firstName, requestee.lastName),
				url: getAppUrl('/collaborators'),
				user: formatName(user.firstName, user.lastName),
			},
			ctx,
		);

		console.log(`Request Collab email sent to ${requestee.email}`);
	}
	catch (error) {
		console.log('Request Collab email not sent', error);
	}

	return newCollabRequest;
};

module.exports = {
	requestCollab,
};
