const moment = require('moment');

const gql = String.raw;

const {
	getUserId,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
	isCustomerTask,
} = require('../utils');
const {NotFoundError} = require('../errors');

// TODO: set back the canceled reminders
const unfinishItem = async (parent, {id, for: scheduledFor}, ctx) => {
	const {token} = ctx;
	const forDate = moment(scheduledFor).format(moment.HTML5_FMT.DATE);

	const fragment = gql`
		fragment ItemWithProject on Item {
			type
			status
			scheduledForDays(orderBy: date_ASC) {
				id
				date
			}
			section {
				project {
					id
				}
			}
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
				AND: [
					{id},
					{
						OR: [
							createItemOwnerFilter(userId),
							createItemCollaboratorFilter(userId),
						],
					},
				],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (!forDate && item.status !== 'FINISHED') {
		throw new Error(`Item '${id}' cannot be resetted.`);
	}

	// unfinish a specific schedule
	if (scheduledFor && item.scheduledForDays.length > 0) {
		const currentDay = item.scheduledForDays.find(
			d => d.date.split('T')[0] === forDate,
		);

		if (currentDay) {
			await ctx.db.updateScheduleSpot({
				where: {id: currentDay.id},
				data: {status: 'PENDING'},
			});
		}
		else {
			throw new Error(`Item '${id}' cannot be unfinished for ${forDate}.`);
		}
	}
	// unfinish the task === unfinish last schedule if scheduled
	else if (item.scheduledForDays.length > 0) {
		await ctx.db.updateScheduleSpot({
			where: {id: item.scheduledForDays[item.scheduledForDays.length - 1].id},
			data: {status: 'PENDING'},
		});
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
		task: {
			connect: {id: updatedItem.id},
		},
		project: item.section && {connect: {id: item.section.project.id}},
	});

	return updatedItem;
};

module.exports = {
	unfinishItem,
};
