const removeTag = (parent, {id}, ctx) => ctx.db.deleteTag({id});

module.exports = {
	removeTag,
};
