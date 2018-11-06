const {createError} = require('apollo-errors');

const AuthError = createError('AuthError', {
	message: 'Not authorized',
});

const InsufficientDataError = createError('InsufficientDataError', {
	message: 'Missing required data',
});

const NotFoundError = createError('NotFoundError', {
	message: 'Not found',
});

module.exports = {
	AuthError,
	InsufficientDataError,
	NotFoundError,
};
