const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const removeCollab = async (parent, {collaboratorId}, ctx) => {
	const [collaborator] = await ctx.db.users({
		where: {
			id: collaboratorId,
			collaborators_some: {
				id: getUserId(ctx),
			},
		},
	});

	if (!collaborator) {
		throw new NotFoundError(`Collaborator ${collaboratorId} does not exist`);
	}

	const projects = await ctx.db.projects({
		where: {
			linkedCollaborators_some: {
				id: collaboratorId,
			},
		},
	});

	projects.forEach(async (p) => {
		await ctx.db.updateProject({
			where: {id: p.id},
			data: {
				linkedCollaborators: {disconnect: {id: collaboratorId}},
			},
		});

		// remove all assignedTasks
		const tasks = await ctx.db.items({
			where: {
				section: {
					project: {
						id: p.id,
					},
				},
				assignee: {
					id: collaboratorId,
				},
			},
		});

		tasks.forEach(async (t) => {
			await ctx.db.updateItem({
				where: {id: t.id},
				data: {
					assignee: {disconnect: true},
					scheduledFor: null,
					schedulePosition: null,
					scheduledForDays: {
						deleteMany: {},
					},
				},
			});
		});
	});

	return ctx.db.updateUser({
		where: {id: getUserId(ctx)},
		data: {
			collaborators: {disconnect: {id: collaboratorId}},
		},
	});
};

module.exports = {
	removeCollab,
};
