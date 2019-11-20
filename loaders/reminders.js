const gql = String.raw;

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

const batchGetReminderById = (ids, db) => db.reminders({where: {id_in: ids}}).$fragment(ReminderWithRelationsFragment);

module.exports = {
	batchGetReminderById,
};
