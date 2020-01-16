const issueQuote = async (
	parent,
	{
		projectId, sections, header, footer, hasTaxes, taxRate,
	},
	ctx,
) => {
	const user = ctx.db.user({id: ctx.userId});
	const newQuoteNumber = user.quoteNumber + 1;
	const sectionsWithItemsCreate = sections.map(section => ({
		...section,
		items: {
			create: section.items,
		},
	}));
	const quote = await ctx.db.createQuote({
		issueNumber: newQuoteNumber,
		project: {connect: {id: projectId}},
		sections: {
			create: sectionsWithItemsCreate,
		},
		hasTaxes,
		taxRate,
		header,
		footer,
	});

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
