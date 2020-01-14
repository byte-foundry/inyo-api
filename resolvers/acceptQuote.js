const {NotFoundError} = require('../errors');

const acceptQuote = async (parent, {id, token}, ctx) => {
	const [quote] = await ctx.db.quotes({
		where: {
			id,
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

	const updatedQuote = await ctx.db.updateQuote({
		acceptedAt: new Date(),
	});

	return updatedQuote;
};

module.exports = {
	acceptQuote,
};
