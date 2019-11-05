const TYPE_TO_OBJECT = {
	FOCUSED_TASK: 'task',
	UNFOCUSED_TASK: 'task',
	SENT_REMINDER: 'reminder',
	CANCELED_REMINDER: 'reminder',
	ADDED_TASK: 'task',
	UPDATED_TASK: 'task',
	FINISHED_TASK: 'task',
	UNFINISHED_TASK: 'task',
	CREATED_PROJECT: 'project',
	UPDATED_PROJECT: 'project',
	ARCHIVED_PROJECT: 'project',
	UNARCHIVED_PROJECT: 'project',
	VIEWED_PROJECT: 'project',
	POSTED_COMMENT: 'comment',
	ADDED_SECTION: 'section',
	UPDATED_SECTION: 'section',
	UPLOADED_ATTACHMENT: 'file',
	LINKED_CUSTOMER_TO_TASK: 'task',
	UNLINKED_CUSTOMER_TO_TASK: 'task',
	LINKED_CUSTOMER_TO_PROJECT: 'project',
	UNLINKED_CUSTOMER_TO_PROJECT: 'project',
	LINKED_COLLABORATOR_TO_PROJECT: 'project',
	UNLINKED_COLLABORATOR_TO_PROJECT: 'project',
	ASSIGNED_TO_TASK: 'task',
	REMOVE_ASSIGNMENT_TO_TASK: 'task',
};

const Event = {
	id: node => node.id,
	from: async (node, args, ctx) => {
		const customer = await ctx.db.customerEvent({id: node.id}).customer();
		const user = await ctx.db.userEvent({id: node.id}).user();

		return customer || user;
	},
	subject: async (node, args, ctx) => {
		if (node.type.includes('CUSTOMER_TO')) return ctx.db.userEvent({id: node.id}).customer();

		return ctx.db.userEvent({id: node.id}).collaborator();
	},
	object: async (node, args, ctx) => {
		if (node.type.includes('REMOVED')) return null;

		const customerEvent = await ctx.db.customerEvent({id: node.id});

		if (customerEvent) {
			const objectKey = TYPE_TO_OBJECT[customerEvent.type];

			try {
				return ctx.db.customerEvent({id: node.id})[objectKey]();
			}
			catch (err) {
				console.log(
					'The customer event object has not been found',
					customerEvent.type,
				);
			}
			return null;
		}

		const userEvent = await ctx.db.userEvent({id: node.id});

		if (userEvent) {
			const objectKey = TYPE_TO_OBJECT[userEvent.type];

			try {
				return ctx.db.userEvent({id: node.id})[objectKey]();
			}
			catch (err) {
				console.log('The user event object has not been found', userEvent.type);
			}
			return null;
		}

		return null;
	},
	metadata: node => node.metadata,
	type: async (node, args, ctx) => {
		const customerEvent = await ctx.db.customerEvent({id: node.id});
		const userEvent = await ctx.db.userEvent({id: node.id});

		return (customerEvent || userEvent).type;
	},
	createdAt: node => node.createdAt,
};

module.exports = {
	Event,
};
