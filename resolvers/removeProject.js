const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');
const {cancelPendingReminders} = require('../reminders/cancelPendingReminders');

const gql = String.raw;

const removeProject = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [project] = await ctx.db.projects({
		where: {
			id,
			OR: [
				{
					owner: {id: userId},
				},
				{
					customer: {
						serviceCompany: {
							owner: {
								id: userId,
							},
						},
					},
				},
			],
		},
	}).$fragment(gql`
		fragment ProjectWithItemStatuses on Project {
			id
			status
			sections(orderBy: position_ASC) {
				items(orderBy: position_ASC) {
					status
				}
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${id} has not been found.`);
	}

	await ctx.db.createUserEvent({
		type: 'REMOVED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: project.id,
			name: project.name,
		},
		project: {
			connect: {id: project.id},
		},
	});

	try {
		const remindersToCancel = await ctx.db.reminders({
			where: {
				status: 'PENDING',
				item: {
					section: {
						project: {id: project.id},
					},
				},
			},
		});

		await cancelPendingReminders(remindersToCancel, id, ctx);
	}
	catch (err) {
		console.log('Error canceling reminders when deleting project.');
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			status: 'REMOVED',
		},
	});
};

module.exports = {
	removeProject,
};
