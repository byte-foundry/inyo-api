const gql = String.raw;

const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');

const removeItem = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			id,
			...createItemOwnerFilter(userId),
		},
	}).$fragment(gql`
		fragment ItemWithSectionItems on Item {
			id
			status
			scheduledFor
			schedulePosition
			section {
				project {
					id
					status
				}
				items(orderBy: position_ASC) {
					id
					position
				}
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.section) {
		if (
			item.section.project.status === 'FINISHED'
			|| item.status === 'FINISHED'
		) {
			throw new Error(`Item '${id}' can't be removed in this state.`);
		}

		const itemIndex = item.section.items.findIndex(
			sectionItem => item.id === sectionItem.id,
		);

		// updating all the positions from the item position
		await Promise.all(
			item.section.items.slice(itemIndex + 1).map((sectionItem, index) => ctx.db.updateItem({
				where: {id: sectionItem.id},
				data: {position: itemIndex + index},
			})),
		);
	}

	if (item.scheduledFor && item.schedulePosition) {
		// resetting dashboard list
		const dayTasks = await ctx.db.items({
			where: {
				scheduledFor: item.scheduledFor,
				schedulePosition_gt: item.schedulePosition,
			},
			orderBy: 'schedulePosition_ASC',
		});

		dayTasks.forEach((task, index) => ctx.db.updateItem({
			where: {id: task.id},
			data: {schedulePosition: item.schedulePosition + index},
		}));
	}

	const removedItem = await ctx.db.deleteItem({id});

	await ctx.db.createUserEvent({
		type: 'REMOVED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: removedItem.id,
			name: removedItem.name,
		},
		project: item.section && {connect: {id: item.section.project.id}},
	});

	return removedItem;
};

module.exports = {
	removeItem,
};
