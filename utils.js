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

module.exports = {
	getUserId,
	APP_SECRET,
};
