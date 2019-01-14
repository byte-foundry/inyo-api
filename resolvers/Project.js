const moment = require('moment-timezone');

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
	issuer: (node, args, ctx) => ctx.db
		.project({id: node.id})
		.customer()
		.serviceCompany(),
	total: async (node, args, ctx) => {
		const {sections} = await ctx.db.project({id: node.id}).$fragment(`
			fragment ProjectUnits on Project {
				sections {
					items {
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
	sections: (node, args, ctx) => ctx.db.project({id: node.id}).sections(),
	viewedByCustomer: node => node.viewedByCustomer,
	issuedAt: node => node.issuedAt,
	deadline: node => node.deadline,
	daysUntilDeadline: async (node, args, ctx) => {
		const user = await ctx.db
			.project({id: node.id})
			.customer()
			.serviceCompany()
			.owner();

		if (!node.deadline) {
			return null;
		}

		const start = moment().tz(user.timeZone || 'Europe/Paris');
		const deadline = moment(node.deadline.split('T')[0]).tz(
			user.timeZone || 'Europe/Paris',
		);
		const isPassed = deadline < start;

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

		return (isPassed ? -1 : 1) * daysBetween;
	},
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Project,
};
