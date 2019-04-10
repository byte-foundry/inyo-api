const {verify} = require('jsonwebtoken');

const {APP_SECRET} = require('../utils');

const checkResetPassword = async (parent, {resetToken}) => {
	// throws if expired or malformed
	await verify(resetToken, APP_SECRET);

	return true;
};

module.exports = {
	checkResetPassword,
};
