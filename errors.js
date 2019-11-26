/* eslint-disable max-classes-per-file */

const {ApolloError} = require('apollo-server');

class AuthError extends ApolloError {
	constructor(message = 'Not authorized') {
		super(message, 'Auth');
	}
}

class PaymentError extends ApolloError {
	constructor(message = 'Not authorized') {
		super(message, 'Payment');
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

class AlreadyExistingError extends ApolloError {
	constructor(message = 'Already existing data') {
		super(message, 'AlreadyExisting');
	}
}

class FileTooBigError extends ApolloError {
	constructor(message = 'File size is too big.') {
		super(message, 'FileTooBig');
	}
}

module.exports = {
	AuthError,
	InsufficientDataError,
	NotFoundError,
	AlreadyExistingError,
	PaymentError,
	FileTooBigError,
};
