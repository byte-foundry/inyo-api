const Notification = {
	id: node => node.id,
	unread: node => node.unread,
	from: (node, args, ctx) => {
		const customer = ctx.db
			.notification({id: node.id})
			.customerEvent()
			.customer();

		if (customer) {
			return customer;
		}

		const user = ctx.db
			.notification({id: node.id})
			.userEvent()
			.user();

		if (user) {
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
