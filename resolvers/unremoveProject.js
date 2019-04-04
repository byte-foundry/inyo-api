const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const unremoveProject = async (parent, {id}, ctx) => {
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

	if (project.status !== 'DELETED') {
		throw new Error(`Project ${id} can't be undeleted.`);
	}

	await ctx.db.createUserEvent({
		type: 'UNREMOVED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: project.id,
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
	unremoveProject,
};
