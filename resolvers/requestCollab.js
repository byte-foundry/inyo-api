const {getUserId, getAppUrl, formatName} = require('../utils');
const {NotFoundError, AlreadyExistingError} = require('../errors');
const {sendRequestCollabEmail} = require('../emails/CollabEmail');

const requestCollab = async (parent, {userEmail: email, inviteSignup}, ctx) => {
	const userEmail = email.toLowerCase();

	// Check requestee exists
	const requestee = await ctx.db.user({
		email: userEmail,
	});

	if (!requestee && !inviteSignup) {
		throw new NotFoundError(`Requestee ${userEmail} does not exist`);
	}

	const isAlreadyCollaborator = await ctx.db.$exists.user({
		where: {
			email: getUserId(ctx),
			collaborators_some: {
				email: userEmail,
			},
		},
	});

	if (isAlreadyCollaborator) {
		throw new AlreadyExistingError(
			`Collaboration with ${userEmail} already exists`,
		);
	}

	// Check there is no collaboration request yet
	const isAlreadyRequested = await ctx.db.$exists.collabRequest({
		where: {
			requester: {id: getUserId(ctx)},
			OR: [
				{
					requestee: {email: userEmail},
				},
				{
					requesteeEmail: userEmail,
				},
			],
		},
	});

	if (isAlreadyRequested) {
		throw new AlreadyExistingError(
			`Collaboration request with ${userEmail} already exists`,
		);
	}

	// Create collaboration
	const newCollabRequest = await ctx.db.createCollabRequest({
		requester: {connect: {id: getUserId(ctx)}},
		requestee: requestee && {connect: {email: userEmail}},
		requesteeEmail: !requestee ? userEmail : undefined,
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
	if (requestee) {
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
	}

	// Send email
	try {
		const user = await ctx.db.user({
			id: getUserId(ctx),
		});

		sendRequestCollabEmail(
			{
				email: userEmail,
				meta: requestee && {userId: requestee.id},
				requesteeName:
					requestee && formatName(requestee.firstName, requestee.lastName),
				url: getAppUrl('/collaborators'),
				user: formatName(user.firstName, user.lastName),
			},
			ctx,
		);

		console.log(`Request Collab email sent to ${userEmail}`);
	}
	catch (error) {
		console.log('Request Collab email not sent', error);
	}

	return newCollabRequest;
};

module.exports = {
	requestCollab,
};
