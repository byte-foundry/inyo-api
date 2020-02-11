const gql = String.raw;

const plannedWorkingTimes = async (root, {from, to}, ctx) => {
	const tasks = await ctx.db.items({
		where: {
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
				position
			}
		}
	`);

	const days = [];

	tasks.forEach((task) => {
		task.scheduledForDays.forEach((scheduledForDay) => {
			if (days) {
			}
		});
	});

	return days;
};

module.exports = {
	plannedWorkingTimes,
};
