const EmailType = {
	id: node => node.id,
	category: node => node.category,
	position: node => node.position,
	defaultTemplate: (node, args, ctx) => {
		if (node.defaultTemplate) {
			return ctx.loaders.emailTemplateLoader.load(node.defaultTemplate.id);
		}

		return ctx.db.emailType({id: node.id}).defaultTemplate();
	},
	availableParams: (node, args, ctx) => {
		console.log(node.availableParams);
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
