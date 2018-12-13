const gql = String.raw;

const {NotFoundError} = require('../errors');
const {getUserId} = require('../utils');
const {cancelPosthookReminder} = require('../reminders/cancelPosthookReminder');

const unsnoozeItem = async (root, {id}, ctx) => {
	const [item] = await ctx.db.items({
		where: {
			id,
			section: {
				project: {
					customer: {
						serviceCompany: {
							owner: {id: getUserId(ctx)},
						},
					},
				},
			},
		},
	}).$fragment(gql`
		fragment SnoozedItem on Item {
			id
			status
			snoozedUntil {
				id
				postHookId
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.status !== 'SNOOZED') {
		throw new Error('Only snoozed items can be unsnoozed.');
	}

	await cancelPosthookReminder({
		id: item.snoozedUntil.id,
		postHookId: item.snoozedUntil.postHookId,
	});

	return ctx.db.updateItem({
		where: {id},
		data: {status: 'PENDING'},
	});
};

module.exports = {
	unsnoozeItem,
};
