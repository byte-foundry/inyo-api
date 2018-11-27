const {verify} = require('jsonwebtoken');

const {AuthError} = require('./errors');

const APP_SECRET = 'appsecret321';

function getUserId(context) {
	const Authorization = context.request.get('Authorization');

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');
		const verifiedToken = verify(token, APP_SECRET);

		return verifiedToken && verifiedToken.userId;
	}

	throw new AuthError();
}

function getRootUrl(uri) {
	if (process.env.NODE_ENV === 'development') {
		return `https://dev.inyo.me${uri}`;
	}

	if (uri.includes('projects/')) {
		return `https://beta.inyo.me${uri}`;
	}

	return `https://app.inyo.me${uri}`;
}

function getAppUrl(uri) {
	return getRootUrl(`/app${uri}`);
}

module.exports = {
	getUserId,
	APP_SECRET,
	getRootUrl,
	getAppUrl,
};
