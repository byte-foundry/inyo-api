const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

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
		workedTimes {
			start
			end
		}
	}
`;

const batchGetItemById = async (ids, db) => {
	const items = await db
		.items({where: {id_in: ids}})
		.$fragment(ItemWithRelationsFragment);

	return ensureKeyOrder(ids, items);
};

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
