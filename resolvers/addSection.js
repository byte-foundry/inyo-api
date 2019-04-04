const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const addSection = async (
	parent,
	{
		optionId, projectId, name, items = [], position: wantedPosition,
	},
	ctx,
) => {
	if (optionId) {
		throw Error("It's not possible to add section to quote anymore.");
	}

	let variables = {};

	if (projectId) {
		const userId = getUserId(ctx);
		const [project] = await ctx.db.projects({
			where: {
				id: projectId,
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
			fragment ProjectWithSection on Project {
				id
				sections(orderBy: position_ASC) {
					id
					position
				}
			}
		`);

		if (!project) {
			throw new NotFoundError(`Project '${projectId}' has not been found.`);
		}

		// default position: end of the list
		let position = project.sections.length;

		if (typeof wantedPosition === 'number') {
			const wantedPositionSectionIndex = project.sections.findIndex(
				section => section.position === wantedPosition,
			);

			if (wantedPositionSectionIndex !== -1) {
				position = wantedPosition;

				// updating all the positions from the item position
				await Promise.all(
					project.sections.slice(position).map((section, index) => ctx.db.updateSection({
						where: {id: section.id},
						data: {position: position + index + 1},
					})),
				);
			}
		}

		variables = {
			project: {connect: {id: projectId}},
			position,
		};
	}

	// eslint-disable-next-line no-param-reassign
	items.forEach((item, index) => {
		item.position = index;
	});

	return ctx.db.createSection({
		...variables,
		name,
		items: {create: items},
	});
};

module.exports = {
	addSection,
};
