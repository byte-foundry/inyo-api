const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const unarchiveProject = async (parent, {id}, ctx) => {
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

	if (project.status !== 'ARCHIVED') {
		throw new Error(`Project ${id} can't be unarchived.`);
	}

	await ctx.db.createUserEvent({
		type: 'UNARCHIVED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: project.id,
		},
		project: {
			connect: {id: project.id},
		},
	});

	return ctx.db.updateProject({
		where: {id},
		data: {
			status: 'ONGOING',
		},
	});
};

module.exports = {
	unarchiveProject,
};
