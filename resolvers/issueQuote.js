const issueQuote = async (
	parent,
	{
		projectId, sections, header, footer, hasTaxes, taxRate,
	},
	ctx,
) => {
	const sectionsWithItemsCreate = sections.map(section => ({
		...section,
		items: {
			create: section.items,
		},
	}));
	const quote = await ctx.db.createQuote({
		project: {connect: {id: projectId}},
		sections: {
			create: sectionsWithItemsCreate,
		},
		hasTaxes,
		taxRate,
		header,
		footer,
	});

	console.log('Created new quote from project', projectId);

	return quote;
};

module.exports = {
	issueQuote,
};
