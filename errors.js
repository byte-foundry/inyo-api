const {ApolloError} = require('apollo-server');

class AuthError extends ApolloError {
	constructor(message = 'Not authorized') {
		super(message, 'Auth');
	}
}

class InsufficientDataError extends ApolloError {
	constructor(message = 'Missing required data') {
		super(message, 'InsufficientData');
	}
}

class NotFoundError extends ApolloError {
	constructor(message = 'Not found') {
		super(message, 'NotFound');
	}
}

module.exports = {
	AuthError,
	InsufficientDataError,
	NotFoundError,
};
