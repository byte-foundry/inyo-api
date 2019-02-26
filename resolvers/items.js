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
				orderBy: position_ASC
				where: {items_some: {status: PENDING}}
			) {
				id
				# we want the pending items
				items(orderBy: position_ASC, where: {status: PENDING}) {
					id
					name
					unit
					reviewer
					status
					type
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

	let userWorkingTime;

	if (user.startWorkAt && user.endWorkAt) {
		const startWorkAt = new Date(
			`1970-01-01T${user.startWorkAt.split('T')[1]}`,
		);
		const endWorkAt = new Date(`1970-01-01T${user.endWorkAt.split('T')[1]}`);

		if (endWorkAt > startWorkAt) {
			userWorkingTime = (endWorkAt - startWorkAt) / 1000 / 60 / 60;
		}
		else {
			userWorkingTime = 24 - (startWorkAt - endWorkAt) / 1000 / 60 / 60;
		}
	}

	userWorkingTime = userWorkingTime || 8; // default working time

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
					const timeLeft = items
						.slice(index)
						.reduce((sum, {unit}) => sum + unit, 0);

					return {
						...item,
						score: hoursUntilDeadline - timeLeft * userWorkingTime,
					};
				}),
			);
		}, [])
		.sort((a, b) => a.score - b.score);

	return projectItems;
};

module.exports = {
	items,
};
