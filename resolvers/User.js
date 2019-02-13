const gql = String.raw;

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
	tasks: async (node, {filter, sort}, ctx) => {
		const tasks = await ctx.db.items({
			where: {
				AND: [
					filter.linkedCustomerId && {
						OR: [
							{
								linkedCustomer: {id: filter.linkedCustomerId},
							},
							{
								section: {
									project: {
										customer: {
											id: filter.linkedCustomerId,
										},
									},
								},
							},
						],
					},
					{
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
				],
				orderBy: sort,
			},
		}).$fragment(gql`
			fragment TaskWithProjet on Item {
				id
				name
				type
				unitPrice
				unit
				section {
					project {
						deadline
					}
				}
				status
				reviewer
				position
				timeItTook
				dueDate
			}
		`);

		if (sort === 'dueDate_ASC') {
			return tasks.sort(
				(a, b) => new Date(a.dueDate) - new Date(b.dueDate)
					|| new Date(a.section.project.deadline)
						- new Date(b.section.project.deadline),
			);
		}
		if (sort === 'dueDate_DESC') {
			return tasks.sort(
				(a, b) => new Date(b.dueDate) - new Date(a.dueDate)
					|| new Date(b.section.project.deadline)
						- new Date(a.section.project.deadline),
			);
		}

		return tasks;
	},
};

module.exports = {
	User,
};
