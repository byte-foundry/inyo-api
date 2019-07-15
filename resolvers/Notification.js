const Notification = {
	id: node => node.id,
	unread: node => node.unread,
	from: async (node, args, ctx) => {
		const customerEvent = await ctx.db
			.notification({id: node.id})
			.customerEvent();

		if (customerEvent) {
			const customer = ctx.db.customerEvent({id: customerEvent.id}).customer();

			return customer;
		}

		const userEvent = await ctx.db.notification({id: node.id}).userEvent();

		if (userEvent) {
			const user = ctx.db.userEvent({id: customerEvent.id}).user();

			return user;
		}

		return null;
	},
	object: async (node, args, ctx) => {
		const customerEvent = await ctx.db
			.notification({id: node.id})
			.customerEvent();

		if (customerEvent) {
			const {id, itemId, projectId} = customerEvent.metadata;

			if (projectId) {
				return ctx.db.project({id: projectId});
			}
			if (id || itemId) {
				return ctx.db.item({id: itemId || id});
			}
		}

		const userEvent = await ctx.db.notification({id: node.id}).userEvent();

		if (userEvent) {
			const {userId, taskId} = userEvent.metadata;

			if (userId) {
				return ctx.db.user({id: userId});
			}
			if (taskId) {
				return ctx.db.item({id: taskId});
			}
		}

		return null;
	},
	eventType: async (node, args, ctx) => {
		const customerEvent = await ctx.db
			.notification({id: node.id})
			.customerEvent();

		if (customerEvent) {
			return customerEvent.type;
		}

		const userEvent = await ctx.db.notification({id: node.id}).userEvent();

		if (userEvent) {
			return userEvent.type;
		}

		return null;
	},
	createdAt: node => node.createdAt,
	updatedAt: node => node.updatedAt,
};

module.exports = {
	Notification,
};
