const File = {
	id: node => node.id,
	owner: async (node, args, ctx) => {
		const user = await ctx.db.file({id: node.id}).ownerUser();
		const customer = await ctx.db.file({id: node.id}).ownerCustomer();

		return user || customer;
	},
	filename: node => node.filename,
	mimetype: node => node.mimetype,
	encoding: node => node.encoding,
	url: node => node.url,
	linkedTask: async (node, args, ctx) => ctx.db.file({id: node.id}).linkedTask(),
};

module.exports = {
	File,
};
