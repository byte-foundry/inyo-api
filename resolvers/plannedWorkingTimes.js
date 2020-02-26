const gql = String.raw;
const moment = require('moment');
const {
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');

const plannedWorkingTimes = async (root, {from, to}, ctx) => {
	const user = await ctx.db.user({id: ctx.userId});
	const tasks = await ctx.db.items({
		where: {
			AND: [
				{
					scheduledForDays_some: {
						AND: [
							{
								date_gte: from,
							},
							{
								date_lt: to,
							},
						],
					},
				},
				{
					OR: [
						createItemOwnerFilter(ctx.userId),
						createItemCollaboratorFilter(ctx.userId),
					],
				},
			],
		},
	}).$fragment(gql`
		fragment TaskWithScheduleDays on Item {
			id
			unit
			workedTimes {
				start
				end
			}
			scheduledForDays {
				date
			}
		}
	`);

	const days = [];

	let workingTime = 8;

	if (user.startWorkAt && user.endWorkAt) {
		const diffTime = moment(user.endWorkAt).diff(
			moment(user.startWorkAt),
			'hours',
			true,
		);

		workingTime = diffTime < 0 ? diffTime + 24 : diffTime;
	}

	if (user.startBreakAt && user.endBreakAt) {
		const diffTime = moment(user.endBreakAt).diff(
			moment(user.startBreakAt),
			'hours',
			true,
		);

		const breakTime = diffTime < 0 ? diffTime + 24 : diffTime;

		workingTime -= breakTime;
	}

	tasks.forEach((task) => {
		task.scheduledForDays.forEach(({date}) => {
			const dateWithoutTime = moment(date).format(moment.HTML5_FMT.DATE);

			let day = days.find(d => d.date === dateWithoutTime);

			if (!day) {
				day = {
					date: dateWithoutTime,
					workingTime: 0,
				};
				days.push(day);
			}

			const remainingScheduledDays = task.scheduledForDays.filter(
				scheduledDay => moment(scheduledDay.date).isAfter(moment().startOf('day')),
			).length;

			if (remainingScheduledDays !== 0 || workingTime !== 0) {
				const timeWorked
					= task.workedTimes.reduce(
						(workedTimeInMilliseconds, {start, end}) => workedTimeInMilliseconds + moment(end).diff(start),
						0,
					) / workingTime;

				const workingTimeForDay = Math.max(
					(task.unit - timeWorked) / remainingScheduledDays,
					0,
				);

				day.workingTime += workingTimeForDay;
			}
		});
	});

	return days;
};

module.exports = {
	plannedWorkingTimes,
};
