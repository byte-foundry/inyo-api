const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const finishProject = async (parent, {id}, ctx) => {
	const [project] = await ctx.db.projects({
		where: {
			id,
			customer: {
				serviceCompany: {
					owner: {
						id: getUserId(ctx),
					},
				},
			},
		},
	}).$fragment(gql`
		fragment ProjectWithItemStatuses on Project {
			id
			status
			sections {
				items {
					status
				}
			}
		}
	`);

	if (!project) {
		throw NotFoundError(`Project ${id} has not been found.`);
	}

	if (
		project.status !== 'ONGOING'
		|| project.sections.some(section => section.items.some(item => item.status !== 'FINISHED'))
	) {
		throw Error(`Project ${id} can't be finished.`);
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			status: 'FINISHED',
		},
	});
};

module.exports = {
	finishProject,
};
