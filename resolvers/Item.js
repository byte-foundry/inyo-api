const moment = require('moment');

const Item = {
	id: node => node.id,
	name: node => node.name,
	linkedCustomer: async (node, args, ctx) => {
		const linkedCustomer = await ctx.db.item({id: node.id}).linkedCustomer();
		const projectCustomer = await ctx.db
			.item({id: node.id})
			.section()
			.project()
			.customer();

		return linkedCustomer || projectCustomer;
	},
	owner: async (node, args, ctx) => {
		const owner = await ctx.db.item({id: node.id}).owner();
		const projectOwner = await ctx.db
			.item({id: node.id})
			.section()
			.project()
			.customer()
			.serviceCompany()
			.owner();

		return owner || projectOwner;
	},
	isFocused: async (node, args, ctx) => {
		const focusedBy = await ctx.db.item({id: node.id}).focusedBy();

		return !!focusedBy;
	},
	type: node => node.type,
	unitPrice: () => null,
	pendingUnit: node => node.pendingUnit,
	unit: node => node.unit,
	section: (node, args, ctx) => ctx.db.item({id: node.id}).section(),
	comments: (node, args, ctx) => ctx.db.item({id: node.id}).comments(),
	vatRate: () => null,
	status: node => node.status,
	reviewer: node => (node.type === 'CUSTOMER' ? 'CUSTOMER' : 'USER'),
	position: node => node.position,
	timeItTook: node => node.timeItTook,
	dueDate: node => node.dueDate,
	attachments: (node, args, ctx) => ctx.db.item({id: node.id}).attachments(),
	reminders: (node, args, ctx) => ctx.db.item({id: node.id}).reminders({
		where: {
			type_in: ['DELAY', 'FIRST', 'SECOND', 'LAST'],
		},
	}),
	remindersPreviews: () => [
		{
			type: 'DELAY',
			sendingDate: moment().add(5, 'minutes'),
			delay: moment.duration(5, 'minutes'),
		},
		{
			type: 'FIRST',
			sendingDate: moment().add(2, 'days'),
			delay: moment.duration(2, 'days'),
		},
		{
			type: 'SECOND',
			sendingDate: moment().add(2 + 3, 'days'),
			delay: moment.duration(2 + 3, 'days'),
		},
		{
			type: 'LAST',
			sendingDate: moment().add(2 + 3 + 1, 'days'),
			delay: moment.duration(2 + 3 + 1, 'days'),
		},
	],
};

module.exports = {
	Item,
};
