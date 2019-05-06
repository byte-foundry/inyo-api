const {getUserId} = require('../utils');

const createTags = async (parent, {tags}, ctx) => {
	const userId = getUserId(ctx);

	tags.forEach((tag) => {
		if (!tag.color.match(/#[0-9a-fA-F]{6}/)) {
			throw new Error(`tags color must be a valid color not ${tag.color}`);
		}
	});

	return ctx.db.updateUser({
		where: {id: userId},
		data: {
			tags: tags
				? {
					create: tags,
				  }
				: undefined,
		},
	});
};

module.exports = {
	createTags,
};
