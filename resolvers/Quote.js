const Quote = {
	id: node => node.id,
	name: node => node.name,
	template: node => node.template,
	customer: (node, args, ctx) => ctx.db.quote({id: node.id}).customer(),
	issuer: (node, args, ctx) => ctx.db.quote({id: node.id}).customer().serviceCompany(),
	total: async (node, args, ctx) => {
		const quote = await ctx.db.quote({id: node.id}).$fragment(`
      fragment QuotePrices on Quote {
        options {
          sections {
            items {
              unitPrice
              unit
            }
          }
        }
      }
    `);

		return quote.options.reduce(
			(sum, option) => sum + option.sections.reduce(
				(sum, section) => sum + section.items.reduce(
					(sum, item) => sum + (item.unitPrice * item.unit),
					0,
				),
				0,
			),
			0,
		);
	},
	status: node => node.status,
	options: (node, args, ctx) => ctx.db.quote({id: node.id}).options(),
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Quote,
};
