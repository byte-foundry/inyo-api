const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateTag = async (parent, {id, ...tag}, ctx) => {
	const userId = getUserId(ctx);

	const [existingTag] = await ctx.db.tags({
		where: {
			id,
			owner: {
				id: userId,
			},
		},
	});

	if (!existingTag) {
		throw new NotFoundError(`Tag '${id}' has not been found.`);
	}

	if (tag.colorBg && !tag.colorBg.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(
			`tags background color must be a valid color not ${tag.color}`,
		);
	}

	if (tag.colorText && !tag.colorText.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(`tags text color must be a valid color not ${tag.color}`);
	}

	return ctx.db.updateTag({
		where: {id},
		data: tag,
	});
};

module.exports = {
	updateTag,
};
