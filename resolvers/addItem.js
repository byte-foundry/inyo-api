const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const addItem = async (
	parent,
	{
		sectionId,
		name,
		type,
		description,
		unit,
		reviewer,
		position: wantedPosition,
	},
	ctx,
) => {
	const [section] = await ctx.db.sections({
		where: {
			id: sectionId,
			project: {
				customer: {
					serviceCompany: {
						owner: {id: getUserId(ctx)},
					},
				},
			},
		},
	}).$fragment(gql`
		fragment SectionWithProject on Section {
			id
			items(orderBy: position_ASC) {
				id
				position
			}
			project {
				status
			}
		}
	`);

	if (!section) {
		throw new NotFoundError(`No section with id '${sectionId}' has been found`);
	}

	if (section.project.status === 'FINISHED') {
		throw new Error('Item cannot be added in this project state.');
	}

	// default position: end of the list
	let position = section.items.length;

	if (wantedPosition) {
		const wantedPositionItemIndex = section.items.findIndex(
			item => item.position === wantedPosition,
		);

		if (wantedPositionItemIndex !== -1) {
			position = wantedPosition;

			// updating all the positions from the item position
			await Promise.all(
				section.items.slice(position).map((item, index) => ctx.db.updateItem({
					where: {id: item.id},
					data: {position: position + index + 1},
				})),
			);
		}
	}

	return ctx.db.createItem({
		section: {connect: {id: sectionId}},
		name,
		type,
		status: 'PENDING',
		reviewer,
		description,
		unit,
		position,
	});
};

module.exports = {
	addItem,
};
