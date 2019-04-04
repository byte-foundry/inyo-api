const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const addSection = async (
	parent,
	{
		projectId, name, items = [], position: wantedPosition,
	},
	ctx,
) => {
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

	// eslint-disable-next-line no-param-reassign
	items.forEach((item, index) => {
		item.position = index;
	});

	const addedSection = await ctx.db.createSection({
		project: {connect: {id: projectId}},
		position,
		name,
		items: {create: items},
	});

	await ctx.db.createUserEvent({
		type: 'ADDED_SECTION',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: addedSection.id,
		},
	});

	return addedSection;
};

module.exports = {
	addSection,
};
