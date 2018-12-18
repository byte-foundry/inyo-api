const {getUserId, getAppUrl} = require('../utils');

const gql = String.raw;

const items = async (root, args, ctx) => {
	const user = await ctx.db.user({id: getUserId(ctx)});
	const projects = await ctx.db.projects({
		where: {
			customer: {
				serviceCompany: {
					owner: {
						id: user.id,
					},
				},
			},
			deadline_not: null,
			status: 'ONGOING',
			// the projects must have at least one user's pending item
			sections_some: {items_some: {status: 'PENDING', reviewer: 'USER'}},
		},
	}).$fragment(gql`
		fragment Projects on Project {
			id
			name
			deadline
			sections(
				# the sections we want must have at least a pending item
				where: {items_some: {status: PENDING}}
			) {
				id
				# we want the pending items
				items(where: {status: PENDING}) {
					id
					name
					unit
					reviewer
					status
				}
			}
		}
	`);

	// filtering out non-active / blocked projects
	const projectsTheUserCanWorkOn = projects.filter((project) => {
		/* eslint-disable */
		for (const section of project.sections) {
			for (const item of section.items) {
				if (item.status === 'PENDING') {
					return item.reviewer === 'USER';
				}
			}
		}
		/* eslint-enable */
		return false;
	});

	// applying a score to each item
	const projectItems = projectsTheUserCanWorkOn
		.reduce((itemsList, project) => {
			const items = [];

			// flattening sections into a single list with additional item properties
			// eslint-disable-next-line no-restricted-syntax
			for (const section of project.sections) {
				// eslint-disable-next-line no-restricted-syntax
				for (const item of section.items) {
					// keeping only the tasks user can do
					if (item.reviewer !== 'USER') {
						break;
					}

					items.push({
						...item,
						sectionId: section.id,
						projectId: project.id,
						url: getAppUrl(`/projects/${project.id}/#${item.id}`),
					});
				}
			}

			const hoursUntilDeadline
				= (new Date(project.deadline) - new Date()) / 1000 / 60 / 60;

			// adding the score (was easier that way)
			return itemsList.concat(
				items.map((item, index) => {
					const hoursLeft = items
						.slice(0, index)
						.reduce((sum, {unit}) => sum + unit, 0);

					return {
						...item,
						score: hoursUntilDeadline - hoursLeft,
					};
				}),
			);
		}, [])
		.sort((a, b) => b.score - a.score);

	return projectItems;
};

module.exports = {
	items,
};
