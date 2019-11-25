const EmailTemplate = {
	id: node => node.id,
	type: (node, args, ctx) => {
		if (node.type) {
			ctx.loaders.emailTypeLoader.load(node.type.id);
		}

		return ctx.db.emailTemplate({id: node.id}).type();
	},
	timing: node => node.timing,
	subject: node => node.subject,
	content: node => node.content,
};

module.exports = {
	EmailTemplate,
};
