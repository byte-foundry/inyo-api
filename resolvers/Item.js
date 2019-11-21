const {remindersSequences} = require('../emails/TaskEmail');

const gql = String.raw;

const Item = {
	id: node => node.id,
	name: node => node.name,
	linkedCustomer: (node, args, ctx) => ctx.loaders.customers.byTaskId.load(node.id),
	owner: (node, args, ctx) => {
		if (node.owner) {
			return ctx.loaders.userLoader.load(node.owner.id);
		}

		return ctx.loaders.users.byTaskId.load(node.id);
	},
	assignee: (node, args, ctx) => {
		if (node.assignee) {
			return ctx.loaders.userLoader.load(node.assignee.id);
		}
		if (node.assignee === null) {
			return null;
		}

		return ctx.db.item({id: node.id}).assignee();
	},
	scheduledFor: node => node.scheduledFor && new Date(node.scheduledFor),
	schedulePosition: node => node.schedulePosition,
	isFocused: async (node, args, ctx) => {
		const scheduledFor = await ctx.db.item({id: node.id}).scheduledFor();

		return !!scheduledFor;
	},
	type: node => node.type,
	unitPrice: () => null,
	pendingUnit: node => node.pendingUnit,
	unit: node => node.unit,
	section: (node, args, ctx) => {
		if (node.section) {
			return ctx.loaders.sectionLoader.load(node.section.id);
		}
		if (node.section === null) {
			return null;
		}

		return ctx.loaders.sections.byItemId.load(node.id);
	},
	comments: (node, args, ctx) => {
		if (node.comments) {
			return ctx.loaders.commentLoader.loadMany(node.comments.map(c => c.id));
		}

		return ctx.db.item({id: node.id}).comments();
	},
	vatRate: () => null,
	status: node => node.status,
	reviewer: node => (node.type === 'CUSTOMER' ? 'CUSTOMER' : 'USER'),
	position: node => node.position,
	timeItTook: node => node.timeItTook,
	dueDate: node => node.dueDate,
	dailyRate: node => node.dailyRate,
	tags: (node, args, ctx) => {
		if (node.tags) {
			return ctx.loaders.tagLoader.loadMany(node.tags.map(tag => tag.id));
		}

		return ctx.db.item({id: node.id}).tags().$fragment(gql`
			fragment TagWithItemsId on Tag {
				id
				name
				colorBg
				colorText
				items {
					id
				}
			}
		`);
	},
	attachments: (node, args, ctx) => {
		if (node.attachments) {
			return ctx.loaders.fileLoader.loadMany(node.attachments.map(f => f.id));
		}

		return ctx.db.item({id: node.id}).attachments();
	},
	reminders: (node, args, ctx) => {
		if (node.attachments) {
			return ctx.loaders.reminderLoader.loadMany(node.reminders.map(r => r.id));
		}

		return ctx.db.item({id: node.id}).reminders({
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
		});
	},
	remindersPreviews: node => remindersSequences[node.type] || [],
	finishedAt: node => node.finishedAt,
	createdAt: node => node.createdAt,
};

module.exports = {
	Item,
};
