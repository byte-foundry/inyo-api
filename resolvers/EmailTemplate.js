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
	owner: (node, args, ctx) => {
		if (node.owner) {
			ctx.loaders.userLoader.load(node.owner.id);
		}

		return ctx.db.emailTemplate({id: node.id}).owner();
	},
};

module.exports = {
	EmailTemplate,
};
