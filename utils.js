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

function getAppUrl(uri) {
	if (process.env.NODE_ENV === 'development') {
		return `https://dev.inyo.me/app${uri}`;
	}

	if (uri.includes('projects/')) {
		return `https://beta.inyo.me/app${uri}`;
	}

	return `https://app.inyo.me/app${uri}`;
}

module.exports = {
	getUserId,
	APP_SECRET,
	getAppUrl,
};
