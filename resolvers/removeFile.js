const removeFile = (parent, {id}, ctx) => ctx.db.deleteFile({id});

module.exports = {
	removeFile,
};
