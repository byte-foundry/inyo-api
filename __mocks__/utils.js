class AuthError extends Error {
	constructor() {
		super('Not authorized');
	}
}

function getUserId(context) {
	const Authorization = context.request.get('Authorization');

	if (Authorization) {
		return Authorization.replace('Bearer ', '');
	}

	throw new AuthError();
}

function getAppUrl(uri) {
	return uri;
}

module.exports = {
	getUserId,
	getAppUrl,
	APP_SECRET: 'Z',
};
