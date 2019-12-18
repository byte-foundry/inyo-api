const EmailType = {
	id: node => node.id,
	category: node => node.category,
	position: node => node.position,
	availableParams: (node, args, ctx) => {
		if (node.availableParams) {
			return ctx.loaders.emailParamForTypeLoader.loadMany(
				node.availableParams.map(p => p.id),
			);
		}

		return ctx.db.emailType({id: node.id}).availableParams();
	},
};

module.exports = {
	EmailType,
};
