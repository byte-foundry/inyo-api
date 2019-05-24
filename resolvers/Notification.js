const Notification = {
	id: node => node.id,
	unread: node => node.unread,
	from: (node, args, ctx) => ctx.db
		.notification({id: node.id})
		.customerEvent()
		.customer(),
	object: async (node, args, ctx) => {
		const event = await ctx.db.notification({id: node.id}).customerEvent();
		const {id, itemId, projectId} = event.metadata;

		if (projectId) {
			return ctx.db.project({id: projectId});
		}
		if (itemId) {
			return ctx.db.item({id: itemId || id});
		}

		return null;
	},
	eventType: async (node, args, ctx) => {
		const event = await ctx.db.notification({id: node.id}).customerEvent();

		return event.type;
	},
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Notification,
};
