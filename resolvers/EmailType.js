const EmailType = {
	id: node => node.id,
	category: node => node.category,
	defaultTemplate: (node, args, ctx) => {
		if (node.defaultTemplate) {
			return ctx.loaders.emailTemplateLoader.load(node.defaultTemplate.id);
		}

		return ctx.db.emailType({id: node.id}).defaultTemplate();
	},
	availableParams: (node, args, ctx) => {
		if (node.availableParams) {
			return ctx.loaders.emailParamLoader.loadMany(
				node.availableParams.map(p => p.id),
			);
		}

		return ctx.db.emailType({id: node.id}).availableParams();
	},
};

module.exports = {
	EmailType,
};
