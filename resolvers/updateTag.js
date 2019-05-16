const updateTag = async (parent, {id, ...tag}, ctx) => {
	if (!tag.colorBg.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(
			`tags background color must be a valid color not ${tag.color}`,
		);
	}

	if (!tag.colorText.match(/#[0-9a-fA-F]{6}/)) {
		throw new Error(`tags text color must be a valid color not ${tag.color}`);
	}

	return ctx.db.updateTag({
		where: {id: tag.id},
		data: tag,
	});
};

module.exports = {
	updateTag,
};
