const gql = String.raw;

const stopCurrentTaskTimer = async (parent, args, ctx) => {
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

	if (!currentTask) return null;

	const updatedItem = await ctx.db.updateItem({
		where: {id: currentTask.id},
		data: {
			workedTimes: {
				update: {
					where: {
						id: currentTask.workedTimes[currentTask.workedTimes.length - 1].id,
					},
					data: {end: new Date()},
				},
			},
			currentlyTimedBy: {disconnect: true},
		},
	});

	return updatedItem;
};

module.exports = {
	stopCurrentTaskTimer,
};
