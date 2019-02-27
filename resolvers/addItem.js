const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const addItem = async (
	parent,
	{
		projectId,
		sectionId,
		name,
		type,
		description,
		unit,
		reviewer,
		position: wantedPosition,
		linkedCustomerId,
		linkedCustomer,
		dueDate,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	let position = 0;

	if (projectId && !sectionId) {
		const [section] = await ctx.db.sections({
			where: {project: {id: projectId}},
			orderBy: 'position_ASC',
			first: 1,
		});

		// eslint-disable-next-line no-param-reassign
		sectionId = section.id;
		// eslint-disable-next-line no-param-reassign
		wantedPosition = wantedPosition || 0;
	}

	if (sectionId) {
		const [section] = await ctx.db.sections({
			where: {
				id: sectionId,
				project: {
					OR: [
						{
							owner: {id: userId},
						},
						{
							customer: {
								serviceCompany: {
									owner: {id: userId},
								},
							},
						},
					],
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
			throw new NotFoundError(
				`No section with id '${sectionId}' has been found`,
			);
		}

		if (section.project.status === 'FINISHED') {
			throw new Error('Item cannot be added in this project state.');
		}

		// default position: end of the list
		position = section.items.length;

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
	}

	return ctx.db.createItem({
		section: sectionId && {connect: {id: sectionId}},
		linkedCustomer: linkedCustomerId
			? {connect: {id: linkedCustomerId}}
			: {create: linkedCustomer},
		owner: {connect: {id: userId}},
		name,
		type,
		status: 'PENDING',
		reviewer,
		description,
		unit,
		position,
		dueDate,
	});
};

module.exports = {
	addItem,
};
