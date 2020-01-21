const issueQuote = async (
	parent,
	{
		projectId, sections, header, footer, hasTaxes, taxRate,
	},
	ctx,
) => {
	const user = await ctx.db.user({id: ctx.userId});
	const newQuoteNumber = user.quoteNumber + 1;
	const sectionsWithItemsCreate = sections.map(section => ({
		...section,
		items: {
			create: section.items,
		},
	}));
	await ctx.db.updateManyQuotes({
		data: {
			invalid: true,
		},
		where: {
			project: {
				owner: {
					id: ctx.userId,
				},
			},
		},
	});
	const quote = await ctx.db.createQuote({
		issueNumber: newQuoteNumber,
		invalid: false,
		project: {connect: {id: projectId}},
		sections: {
			create: sectionsWithItemsCreate,
		},
		hasTaxes,
		taxRate,
		header,
		footer,
	});
	const quotes = await ctx.db.quotes({
		where: {
			invalid: true,
			project: {
				owner: {
					id: ctx.userId,
				},
			},
		},
	});
	await Promise.all(
		quotes.map(quoteToUpdate => ctx.db.updateQuote({
			where: {
				id: quoteToUpdate.id,
			},
			data: {
				validQuote: {connect: {id: quote.id}},
			},
		})),
	);

	await ctx.db.updateUser({
		where: {id: ctx.userId},
		data: {
			quoteNumber: newQuoteNumber,
		},
	});

	console.log('Created new quote from project', projectId);

	return quote;
};

module.exports = {
	issueQuote,
};
