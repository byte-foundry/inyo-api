const moment = require('moment');

const {NotFoundError} = require('../errors');
const {getUserId} = require('../utils');
const {createPosthookReminder} = require('../reminders/createPosthookReminder');

const snoozeItem = async (root, {id, until, during}, ctx) => {
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
	});

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.status !== 'PENDING') {
		throw new Error('Only pending items can be snoozed.');
	}

	let date;

	if (until) {
		date = moment(until);
		if (!date.isValid() || date < moment()) {
			throw new Error('The date is not valid, it must be in the future.');
		}
	}
	else if (typeof during === 'number') {
		if (during <= 0) {
			throw new Error('The duration is not valid. It must be positive.');
		}

		date = moment().add(during, 'days');
	}
	else {
		date = null;
	}

	let reminder;

	if (date) {
		reminder = await createPosthookReminder({
			type: 'SNOOZE_END',
			data: {
				itemId: id,
			},
			postAt: date.toJSON(),
		});
	}

	return ctx.db.updateItem({
		where: {id},
		data: {
			status: 'SNOOZED',
			snoozedUntil: reminder && {connect: {id: reminder.id}},
		},
	});
};

module.exports = {
	snoozeItem,
};
