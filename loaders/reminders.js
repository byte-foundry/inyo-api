const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const ReminderWithRelationsFragment = gql`
	fragment ReminderWithRelationsId on Reminder {
		id
		postHookId
		type
		sendingDate
		status
		item {
			id
		}
		user {
			id
		}
		morningRemindersUser {
			id
		}
		eveningRemindersUser {
			id
		}
	}
`;

const batchGetReminderById = async (ids, db) => {
	const reminders = await db
		.reminders({where: {id_in: ids}})
		.$fragment(ReminderWithRelationsFragment);

	return ensureKeyOrder(ids, reminders);
};

module.exports = {
	batchGetReminderById,
};
