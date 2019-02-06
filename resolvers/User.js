const User = {
	id: node => node.id,
	email: node => node.email,
	hmacIntercomId: node => node.hmacIntercomId,
	firstName: node => node.firstName,
	lastName: node => node.lastName,
	customers: (node, args, ctx) => ctx.db
		.user({id: node.id})
		.company()
		.customers(),
	company: (node, args, ctx) => ctx.db.user({id: node.id}).company(),
	startWorkAt: node => node.startWorkAt && new Date(node.startWorkAt),
	endWorkAt: node => node.endWorkAt && new Date(node.endWorkAt),
	workingDays: node => node.workingDays,
	timeZone: node => node.timeZone,
	defaultDailyPrice: node => node.defaultDailyPrice,
	defaultVatRate: node => node.defaultVatRate,
	workingFields: node => node.workingFields,
	jobType: node => node.jobType,
	interestedFeatures: node => node.interestedFeatures,
	hasUpcomingProject: node => node.hasUpcomingProject,
	settings: (node, args, ctx) => ctx.db.user({id: node.id}).settings(),
	tasks: async (node, args, ctx) => ctx.db.items({
		where: {
			OR: [
				{
					owner: {id: node.id},
				},
				{
					section: {
						project: {
							customer: {
								serviceCompany: {
									owner: {id: node.id},
								},
							},
						},
					},
				},
			],
		},
	}),
};

module.exports = {
	User,
};
