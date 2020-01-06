const moment = require('moment-timezone');

const gql = String.raw;

const weekDays = {
	1: 'MONDAY',
	2: 'TUESDAY',
	3: 'WEDNESDAY',
	4: 'THURSDAY',
	5: 'FRIDAY',
	6: 'SATURDAY',
	0: 'SUNDAY',
};

const Project = {
	id: node => node.id,
	name: node => node.name,
	template: node => node.template,
	customer: (node, args, ctx) => {
		if (node.customer) {
			return ctx.loaders.customerLoader.load(node.customer.id);
		}
		if (node.customer === null) {
			return null;
		}

		return ctx.db.project({id: node.id}).customer();
	},
	token: node => node.token,
	owner: (node, args, ctx) => {
		if (node.owner) {
			return ctx.loaders.userLoader.load(node.owner.id);
		}

		return ctx.db.project({id: node.id}).owner();
	},
	sharedNotes: node => node.sharedNotes,
	personalNotes: node => node.personalNotes,
	issuer: async (node, args, ctx) => ctx.db
		.project({id: node.id})
		.owner()
		.company(),
	total: async (node, args, ctx) => {
		const {sections} = await ctx.db.project({id: node.id}).$fragment(gql`
			fragment ProjectUnits on Project {
				sections(orderBy: position_ASC) {
					items(orderBy: position_ASC) {
						unit
					}
				}
			}
		`);

		return sections.reduce(
			(sum, section) => sum + section.items.reduce((itemSum, item) => itemSum + item.unit, 0),
			0,
		);
	},
	status: node => node.status,
	sections: (node, args, ctx) => {
		if (node.sections) {
			return ctx.loaders.sectionLoader.loadMany(node.sections.map(s => s.id));
		}

		return ctx.db.sections({
			where: {project: {id: node.id}},
			orderBy: 'position_ASC',
		});
	},
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	deadline: node => node.deadline,
	budget: node => node.budget,
	notifyActivityToCustomer: node => node.notifyActivityToCustomer,
	daysUntilDeadline: async (node, args, ctx) => {
		if (!node.deadline) {
			return null;
		}

		const project = await ctx.db.project({id: node.id}).$fragment(gql`
			fragment Owner on Project {
				owner {
					timeZone
					workingDays
				}
				customer {
					serviceCompany {
						owner {
							timeZone
							workingDays
						}
					}
				}
			}
		`);

		const user = project.owner || project.customer.serviceCompany.owner;

		const start = moment().tz(ctx.timeZone);
		const deadline = moment(node.deadline.split('T')[0]).tz(
			user.timeZone || 'Europe/Paris',
		);

		let daysBetween = 0;

		if (start.format('DD/MM/YYYY') === deadline.format('DD/MM/YYYY')) {
			return daysBetween;
		}

		while (start < deadline) {
			if (
				!user.workingDays
				|| user.workingDays.length === 0
				|| user.workingDays.includes(weekDays[start.day()])
			) {
				daysBetween++;
			}
			start.add(1, 'd');
		}

		return daysBetween;
	},
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
	attachments: (node, args, ctx) => ctx.db.files({
		where: {
			linkedProject: {id: node.id},
		},
	}),
	linkedCollaborators: (node, args, ctx) => {
		if (node.linkedCollaborators) {
			return ctx.loaders.userLoader.loadMany(
				node.linkedCollaborators.map(c => c.id),
			);
		}

		return ctx.loaders.users.collaboratorsByProjectId.load(node.id);
	},
	quoteHeader: node => node.quoteHeader,
	quoteFooter: node => node.quoteFooter,
	quotes: (node, args, ctx) => ctx.db.quotes({where: {project: {id: node.id}}}),
};

module.exports = {
	Project,
};
