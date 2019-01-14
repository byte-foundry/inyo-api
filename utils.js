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

	if (uri.includes('quotes/')) {
		return `https://app.inyo.me${uri}`;
	}

	return `https://beta.inyo.me${uri}`;
}

function getAppUrl(uri) {
	return getRootUrl(`/app${uri}`);
}

function titleNameEmail(strings, title, firstName, lastName) {
	const titleToRender = title !== undefined && title !== null ? title : '';
	const firstNameToRender
		= firstName !== undefined && firstName !== null ? firstName : '';
	const lastNameToRender
		= lastName !== undefined && lastName !== null ? lastName : '';

	return String(
		` ${titleToRender} ${firstNameToRender} ${lastNameToRender}`,
	).trimRight();
}

module.exports = {
	getUserId,
	APP_SECRET,
	getRootUrl,
	getAppUrl,
	titleNameEmail,
};
