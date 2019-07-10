const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');

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
		id: getUserId(),
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
	const collabRequest = await ctx.db.collabRequests({
		where: {
			requester: {id: getUserId()},
			requestee: {email: userEmail},
			status: 'REJECTED',
		},
	});

	if (collabRequest) {
		throw new AlreadyExistingError(
			`Collaboration with ${userEmail} already rejected`,
		);
	}

	// Create collaboration
	const newCollabRequest = await ctx.db.createCollabRequest({
		requester: {connect: {id: getUserId()}},
		requestee: {connect: {email: userEmail}},
		status: 'PENDING',
	});

	// Create Requester user event
	const requesterEvent = await ctx.db.createUserEvent({
		type: 'COLLAB_REQUEST',
		user: {connect: {id: getUserId()}},
		metadata: {
			requesteeEmail: userEmail,
		},
	});

	// Create Requestee user event
	const requesteeEvent = await ctx.db.createUserEvent({
		type: 'COLLAB_ASKED',
		user: {connect: {email: userEmail}},
		metadata: {
			requesterId: getUserId(),
			requesterEmail: user.email,
			requesterFirstName: user.firstName,
			requesterLastName: user.lastName,
		},
	});

	// Create Request notification
	const requesteeNotification = await ctx.db.createNotification({
		userEvent: {connect: {id: requesteeEvent.id}},
		user: {connect: {email: userEmail}},
	});

	// Send email
};

module.exports = {
	requestCollab,
};
