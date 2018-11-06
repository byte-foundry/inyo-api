class AuthError extends Error {
	constructor(message = 'Not authorized') {
		super(message);
	}
}

class InsufficientDataError extends Error {
	constructor(message = 'Missing required data') {
		super(message);
	}
}

class NotFoundError extends Error {
	constructor(message = 'Not found') {
		super(message);
	}
}

module.exports = {
	AuthError,
	InsufficientDataError,
	NotFoundError,
};
