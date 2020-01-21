const {AlreadyExistingError, NotFoundError} = require('../errors');

const acceptQuote = async (parent, {id, token}, ctx) => {
	const [quote] = await ctx.db.quotes({
		where: {
			id,
			invalid: false,
			project: {
				customer: {
					token,
				},
			},
		},
	});

	if (!quote) {
		throw new NotFoundError(`Quote '${id}' has not been found.`);
	}

	if (quote.acceptedAt) {
		throw new AlreadyExistingError(`Quote '${id}' has already been accepted`);
	}

	const updatedQuote = await ctx.db.updateQuote({
		where: {
			id,
		},
		data: {
			acceptedAt: new Date(),
		},
	});

	return updatedQuote;
};

module.exports = {
	acceptQuote,
};
