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
								date_gt: from,
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
		const diffTime = moment(user.endWorkAt, 'HH:mm:ss').diff(
			moment(user.startWorkAt, 'HH:mm:ss'),
			'hours',
			true,
		);

		workingTime = diffTime < 0 ? diffTime + 24 : diffTime;
	}

	if (user.startBreakAt && user.endBreakAt) {
		const diffTime = moment(user.endBreakAt, 'HH:mm:ss').diff(
			moment(user.startBreakAt, 'HH:mm:ss'),
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
			const timeWorked
				= task.workedTimes.reduce((workedTimeInMilliseconds, {start, end}) => workedTimeInMilliseconds + moment(end).diff(start), 0) / workingTime;

			const workingTimeForDay = Math.max(
				(task.unit - timeWorked) / remainingScheduledDays,
				0,
			);

			day.workingTime += workingTimeForDay;
		});
	});

	return days;
};

module.exports = {
	plannedWorkingTimes,
};
