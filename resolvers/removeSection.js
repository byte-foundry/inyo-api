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

	return ctx.db.deleteSection({id});
};

module.exports = {
	removeSection,
};
