const {NotFoundError} = require('../errors');

const gql = String.raw;

const clearTaskWorkedTimes = async (parent, {taskId}, ctx) => {
	const [task] = await ctx.db.items({
		where: {
			id: taskId,
			owner: {id: ctx.userId},
		},
	}).$fragment(gql`
		fragment CurrentTask on Task {
			id
			currentlyTimedBy {
				id
			}
			workedTimes {
				id
				start
				end
			}
		}
	`);

	if (!task) {
		throw new NotFoundError(`Task '${taskId}' has not been found.`);
	}

	return ctx.db.updateItem({
		where: {id: taskId},
		data: {
			workedTimes: {deleteMany: {}},
			currentlyTimedBy: task.currentlyTimedBy && {disconnect: true},
		},
	});
};

module.exports = {
	clearTaskWorkedTimes,
};
