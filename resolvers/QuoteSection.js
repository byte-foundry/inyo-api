const QuoteSection = {
	id: node => node.id,
	name: node => node.name,
	items: (node, args, ctx) => ctx.db.quoteSection({id: node.id}).items(),
	price: node => node.price,
};

module.exports = {
	QuoteSection,
};
