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
	getAppUrl,
	APP_SECRET: 'Z',
	titleNameEmail,
};
