const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

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
	});

	if (!section) {
		throw new NotFoundError(`Section '${id}' has not been found.`);
	}

	const projectId = section.project.id;
	const removedSection = await ctx.db.deleteSection({id});
	const projectSections = await ctx.db.sections({
		where: {
			project: {
				id: projectId,
			},
		},
	});

	projectSections.map((section, index) => ctx.db.updateSection({
		where: {id: section.id},
		data: {
			position: index,
		},
	}));


	await ctx.db.createUserEvent({
		type: 'REMOVED_SECTION',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: removedSection.id,
		},
	});

	return removedSection;
};

module.exports = {
	removeSection,
};
