const Customer = {
	id: node => node.id,
	name: node => node.name,
	email: node => node.email,
	address: (node, args, ctx) => ctx.db.customer({id: node.id}).address(),
	phone: node => node.phone,
	occupation: node => node.occupation,
	userNotes: node => node.userNotes,
	siret: node => node.siret,
	token: node => node.token,
	rcs: node => node.rcs,
	rm: node => node.rm,
	vat: node => node.vat,
	title: node => node.title,
	language: async (node, args, ctx) => {
		const settings = await ctx.db
			.customer({id: node.id})
			.serviceCompany()
			.owner()
			.settings();

		return settings.language;
	},
};

module.exports = {
	Customer,
};
