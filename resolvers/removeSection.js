const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const removeSection = async (parent, {id}, ctx) => {
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
		fragment SectionAndProject on Section {
			id
			position
			project {
				id
			}
			items {
				id
				name
			}
		}
	`);

	if (!section) {
		throw new NotFoundError(`Section '${id}' has not been found.`);
	}

	section.items.forEach((removedItem) => {
		ctx.db.createUserEvent({
			type: 'REMOVED_TASK',
			user: {
				connect: {id: userId},
			},
			metadata: {
				id: removedItem.id,
				name: removedItem.name,
			},
			project: {connect: {id: section.project.id}},
		});
	});

	const removedSection = await ctx.db.deleteSection({id});

	const projectSections = await ctx.db.sections({
		where: {
			project: {id: section.project.id},
			position_gt: section.position,
		},
		orderBy: 'position_ASC',
	});

	projectSections.forEach((sectionToUpdate, index) => ctx.db.updateSection({
		where: {id: sectionToUpdate.id},
		data: {position: index},
	}));

	await ctx.db.createUserEvent({
		type: 'REMOVED_SECTION',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: removedSection.id,
			name: removedSection.name,
		},
		project: section.project && {connect: {id: section.project.id}},
	});

	return removedSection;
};

module.exports = {
	removeSection,
};
