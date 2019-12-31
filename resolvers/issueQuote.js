const uuid = require('uuid/v4');
const {NotFoundError} = require('../errors');

const issueQuote = async (
	parent,
	{
		projectId, sections, header, footer,
	},
	ctx,
) => {
	const quote = await ctx.db.createQuote({
		token: uuid(),
		project: {connect: {id: projectId}},
		sections: {
			create: sections,
		},
		header,
		footer,
	});

	console.log('Created new quote from project', projectId);

	return quote;
};

module.exports = {
	issueQuote,
};
