const {getUserId} = require('../utils');

const createTag = async (parent, tag, ctx) => {
	const userId = getUserId(ctx);

	if (!tag.color.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(`tags color must be a valid color not ${tag.color}`);
	}

	return ctx.db.updateUser({
		where: {id: userId},
		data: {
			tags: tag
				? {
					create: tag,
				  }
				: undefined,
		},
	});
};

module.exports = {
	createTag,
};
