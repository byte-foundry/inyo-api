const EmailParamForType = {
	id: node => node.id,
	param: (node, args, ctx) => {
		if (node.param) {
			return ctx.loaders.emailParamLoader.load(node.param.id);
		}

		return ctx.db.emailParamForType({id: node.id}).param();
	},
	required: node => node.required,
};

module.exports = {
	EmailParamForType,
};
