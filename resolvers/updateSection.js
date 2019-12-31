const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const updateSection = async (
	parent,
	{
		id, name, position: wantedPosition, price,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const [section] = await ctx.db.sections({
		where: {
			id,
			project: {
				OR: [
					{
						owner: {
							id: userId,
						},
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
		},
	}).$fragment(gql`
		fragment sectionWithProject on Section {
			id
			project {
				id
				sections(orderBy: position_ASC) {
					id
				}
			}
		}
	`);

	if (!section) {
		throw new NotFoundError(`Section '${id}' has not been found.`);
	}

	const {project} = section;

	let position;
	const initialPosition = project.sections.findIndex(
		projectSection => projectSection.id === section.id,
	);

	if (initialPosition === -1) {
		throw new Error(
			`Section '${section.id}' has not been found in Project '${
				section.project.id
			}' sections.`,
		);
	}

	if (
		typeof wantedPosition === 'number'
		&& wantedPosition !== initialPosition
	) {
		if (wantedPosition < 0) {
			position = 0;
		}
		else if (wantedPosition > project.sections.length) {
			position = project.sections.length;
		}
		else {
			position = wantedPosition;
		}

		// TODO: externalize
		const reorderProject = async (
			sections,
			initialPosition, // eslint-disable-line no-shadow
			wantedPosition, // eslint-disable-line no-shadow
			ctx, // eslint-disable-line no-shadow
		) => {
			const itemsToUpdate
				= wantedPosition > initialPosition
					? sections.slice(initialPosition + 1, wantedPosition + 1)
					: sections.slice(wantedPosition, initialPosition);

			const startIndex
				= wantedPosition > initialPosition ? initialPosition : wantedPosition + 1;

			await Promise.all(
				itemsToUpdate.map((sectionItem, index) => ctx.db.updateSection({
					where: {id: sectionItem.id},
					data: {position: startIndex + index},
				})),
			);
		};

		reorderProject(project.sections, initialPosition, position, ctx);
	}

	const updatedSection = await ctx.db.updateSection({
		where: {id},
		data: {name, position, price},
	});

	await ctx.db.createUserEvent({
		type: 'UPDATED_SECTION',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: updatedSection.id,
		},
		section: {
			connect: {id: updatedSection.id},
		},
		project: {connect: {id: section.project.id}},
	});

	return updatedSection;
};

module.exports = {
	updateSection,
};
