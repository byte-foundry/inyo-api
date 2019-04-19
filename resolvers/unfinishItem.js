const gql = String.raw;

const {getUserId, createItemOwnerFilter, isCustomerTask} = require('../utils');
const {NotFoundError} = require('../errors');

// TODO: set back the canceled reminders
const unfinishItem = async (parent, {id, token}, ctx) => {
	const fragment = gql`
		fragment ItemWithProject on Item {
			type
			status
			canceledReminders: reminders(where: {status: CANCELED}) {
				id
				postHookId
				type
				status
			}
		}
	`;

	if (token) {
		const [item] = await ctx.db
			.items({
				where: {
					id,
					OR: [
						{
							section: {
								project: {
									OR: [{token}, {customer: {token}}],
								},
							},
						},
						{
							linkedCustomer: {token},
						},
					],
				},
			})
			.$fragment(fragment);

		if (!isCustomerTask(item)) {
			throw new Error('This item cannot be resetted by the customer.');
		}

		if (item.status !== 'FINISHED') {
			throw new Error(`Item '${id}' cannot be resetted.`);
		}

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'PENDING',
				finishedAt: null,
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				AND: [{id}, createItemOwnerFilter(userId)],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (isCustomerTask(item)) {
		throw new Error('This item cannot be resetted by the user.');
	}

	if (item.status !== 'FINISHED') {
		throw new Error(`Item '${id}' cannot be resetted.`);
	}

	const updatedItem = await ctx.db.updateItem({
		where: {id},
		data: {
			status: 'PENDING',
			finishedAt: null,
			timeItTook: null,
		},
	});

	await ctx.db.createUserEvent({
		type: 'UNFINISHED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: updatedItem.id,
		},
	});

	return updatedItem;
};

module.exports = {
	unfinishItem,
};
