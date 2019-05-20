const {getUserId} = require('../utils');

const createTag = async (parent, tag, ctx) => {
	const userId = getUserId(ctx);

	if (!tag.colorBg.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(
			`tags background color must be a valid color not ${tag.color}`,
		);
	}

	if (!tag.colorText.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(`tags text color must be a valid color not ${tag.color}`);
	}

	return ctx.db.createTag({
		...tag,
		owner: {
			connect: {id: userId},
		},
	});
};

module.exports = {
	createTag,
};
