const gql = String.raw;

const startTaskTimer = async (parent, {id}, ctx) => {
	const currentTask = await ctx.db.user({id: ctx.userId}).currentTask()
		.$fragment(gql`
		fragment CurrentTask on Task {
			id
			workedTimes {
				id
				start
				end
			}
		}
	`);

	if (currentTask) {
		if (currentTask.id === id) return currentTask;

		await ctx.db.updateTimeRange({
			where: {
				id: currentTask.workedTimes[currentTask.workedTimes.length - 1].id,
			},
			data: {end: new Date()},
		});
	}

	const newCurrentTask = await ctx.db.updateItem({
		where: {id},
		data: {
			currentlyTimedBy: {connect: {id: ctx.userId}},
			workedTimes: {
				create: {
					start: new Date(),
				},
			},
		},
	});

	return newCurrentTask;
};

module.exports = {
	startTaskTimer,
};
