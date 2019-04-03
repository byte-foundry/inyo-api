const utils = jest.requireActual('../utils');

function getUserId(context) {
	const Authorization = context.request.get('Authorization');

	if (Authorization) {
		return Authorization.replace('Bearer ', '');
	}

	throw new utils.AuthError();
}

function getAppUrl(uri) {
	return uri;
}

module.exports = {
	...utils,
	getUserId,
	getAppUrl,
	APP_SECRET: 'Z',
};
