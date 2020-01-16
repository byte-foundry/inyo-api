const gql = String.raw;

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
	vatRate: node => node.vatRate,
	logo: (node, args, ctx) => ctx.db.company({id: node.id}).logo(),
	banner: (node, args, ctx) => {
		if (node.bannerUnsplashId) {
			return ctx.dataSources.photo.getPhotoById({id: node.bannerUnsplashId});
		}

		return ctx.db.company({id: node.id}).banner();
	},
	customers: (node, args, ctx) => ctx.db.company({id: node.id}).customers(),
	projects: async (node, args, ctx) => {
		const customers = await ctx.db.company({id: node.id}).customers()
			.$fragment(gql`
			fragment CustomerProjects on Customer {
				projects {
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
			.map(customer => customer.projects)
			.reduce(
				(projects, projectsPerCustomer) => projects.concat(projectsPerCustomer),
				[],
			);
	},
	documents: (node, args, ctx) => ctx.db.company({id: node.id}).documents(),
};

module.exports = {
	Company,
};
