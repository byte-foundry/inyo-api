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
			scheduledForDays {
				date
				position
			}
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

	// resetting dashboard lists
	item.scheduledForDays.forEach(async (day) => {
		const daySpots = await ctx.db.scheduleSpots({
			where: {
				date: day.date,
				position_gt: day.position,
			},
			orderBy: 'position_ASC',
		});

		daySpots.forEach((spot, index) => ctx.db.updateScheduleSpot({
			where: {id: spot.id},
			data: {position: spot.position + index},
		}));
	});

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
