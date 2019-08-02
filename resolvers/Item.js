const {remindersSequences} = require('../emails/TaskEmail');

const {ADMIN_TOKEN} = process.env;

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
	assignee: (node, args, ctx) => ctx.db.item({id: node.id}).assignee(),
	scheduledFor: node => node.scheduledFor && new Date(node.scheduledFor),
	schedulePosition: node => node.schedulePosition,
	isFocused: async (node, args, ctx) => {
		const focusedBy = await ctx.db.item({id: node.id}).focusedBy();
		const scheduledFor = await ctx.db.item({id: node.id}).scheduledFor();

		return !!focusedBy || !!scheduledFor;
	},
	type: node => node.type,
	unitPrice: () => null,
	pendingUnit: node => node.pendingUnit,
	unit: node => node.unit,
	section: (node, args, ctx) => ctx.db.item({id: node.id}).section(),
	comments: async (node, args, ctx) => {
		const comments = ctx.db.item({id: node.id}).comments();

		if (ctx.token !== ADMIN_TOKEN) {
			await Promise.all(
				comments.map(comment => ctx.db.updateComment({
					where: {id: comment.id},
					data: {
						views: {
							create: ctx.token
								? {
									customer: {connect: {token: ctx.token}},
									  }
								: {
									user: {connect: {id: ctx.userId}},
									  },
						},
					},
				})),
			);
		}

		return comments;
	},
	vatRate: () => null,
	status: node => node.status,
	reviewer: node => (node.type === 'CUSTOMER' ? 'CUSTOMER' : 'USER'),
	position: node => node.position,
	timeItTook: node => node.timeItTook,
	dueDate: node => node.dueDate,
	tags: (node, args, ctx) => ctx.db.item({id: node.id}).tags(),
	attachments: (node, args, ctx) => ctx.db.item({id: node.id}).attachments(),
	reminders: (node, args, ctx) => ctx.db.item({id: node.id}).reminders({
		where: {
			type_in: [
				'DELAY',
				'FIRST',
				'SECOND',
				'LAST',
				'INVOICE_DELAY',
				'INVOICE_FIRST',
				'INVOICE_SECOND',
				'INVOICE_THIRD',
				'INVOICE_FOURTH',
				'INVOICE_LAST',
			],
		},
	}),
	remindersPreviews: node => remindersSequences[node.type] || [],
	finishedAt: node => node.finishedAt,
	createdAt: node => node.createdAt,
};

module.exports = {
	Item,
};
