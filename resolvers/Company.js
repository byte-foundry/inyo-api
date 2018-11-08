const Company = {
	id: node => node.id,
	name: node => node.name,
	owner: (node, args, ctx) => ctx.db.company({id: node.id}).owner(),
	email: node => node.email,
	address: (node, args, ctx) => ctx.db.company({id: node.id}).address(),
	phone: node => node.phone,
	siret: node => node.siret,
	rcs: node => node.rcs,
	rm: node => node.rm,
	vat: node => node.vat,
	logo: (node, args, ctx) => ctx.db.company({id: node.id}).logo(),
	customers: (node, args, ctx) => ctx.db.company({id: node.id}).customers(),
	quotes: async (node, args, ctx) => {
		const customers = await ctx.db.company({id: node.id}).customers()
			.$fragment(`
      fragment CustomerQuotes on Customer {
        quotes {
          id
          name
          template
          status
          viewedByCustomer
          issuedAt
          createdAt
          updatedAt
        }
      }
    `);

		return customers
			.map(customer => customer.quotes)
			.reduce(
				(quotes, quotesPerCustomer) => quotes.concat(quotesPerCustomer),
				[],
			);
	},
};

module.exports = {
	Company,
};
