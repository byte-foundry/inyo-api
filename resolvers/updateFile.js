const updateFile = (parent, {id, filename}, ctx) => {
	if (!filename) {
		throw new Error('Filename cannot be empty.');
	}

	return ctx.db.updateFile({where: {id}, data: {filename}});
};

module.exports = {
	updateFile,
};
