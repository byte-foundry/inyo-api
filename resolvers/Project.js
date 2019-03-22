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
	customer: (node, args, ctx) => ctx.db.project({id: node.id}).customer(),
	owner: async (node, args, ctx) => {
		const owner = await ctx.db.project({id: node.id}).owner();

		if (owner) return owner;

		return ctx.db
			.project({id: node.id})
			.customer()
			.serviceCompany()
			.owner();
	},
	sharedNotes: node => node.sharedNotes,
	issuer: async (node, args, ctx) => {
		const owner = await ctx.db
			.project({id: node.id})
			.customer()
			.serviceCompany();

		if (owner) return owner;

		return ctx.db
			.project({id: node.id})
			.owner()
			.company();
	},
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
	sections: (node, args, ctx) => ctx.db.project({id: node.id}).sections({orderBy: 'position_ASC'}),
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	deadline: node => node.deadline,
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

		const start = moment().tz(user.timeZone || 'Europe/Paris');
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
			OR: [
				{
					linkedTask: {
						section: {
							project: {id: node.id},
						},
					},
				},
				{
					linkedProject: {id: node.id},
				},
			],
		},
	}),
};

module.exports = {
	Project,
};
