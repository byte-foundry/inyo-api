const gql = String.raw;

const ItemWithRelationsFragment = gql`
	fragment ItemWithRelationsId on Item {
		id
		scheduledFor
		schedulePosition
		name
		type
		description
		unit
		status
		reviewer
		finishedAt
		position
		dailyRate
		dueDate
		createdAt
		updatedAt
		timeItTook
		reminders {
			id
		}
		tags {
			id
		}
	}
`;

const batchGetItemById = (ids, db) => db.items({where: {id_in: ids}}).$fragment(ItemWithRelationsFragment);

const batchGetItemByReminderId = async (ids, db) => {
	const items = await db
		.items({where: {reminders_some: {id_in: ids}}})
		.$fragment(ItemWithRelationsFragment);

	return ids.map(id => items.find(item => item.reminders.find(reminder => reminder.id === id)));
};

const batchGetItemByTag = async (ids, db) => {
	const items = await db
		.items({where: {reminders_some: {id_in: ids}}})
		.$fragment(ItemWithRelationsFragment);

	return ids.map(id => items.find(item => item.reminders.find(reminder => reminder.id === id)));
};

module.exports = {
	batchGetItemById,
	batchGetItemByReminderId,
	batchGetItemByTag,
};
