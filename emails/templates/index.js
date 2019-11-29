const CUSTOMER = require('./customer');

const templates = {
	CUSTOMER,
};

const createTemplates = async (ctx, language) => {
	const {userId} = ctx;

	const emailTemplates = await ctx.db.user({id: userId}).emailTemplates();

	if (emailTemplates.length === 0) {
		const types = await ctx.db.emailTypes();

		types.forEach(async (type) => {
			let templateContent;

			try {
				templateContent = templates[type.category][type.name][language];
			}
			catch (e) {
				console.log(
					`no template right now for ${type.category} ${type.name} ${language}`,
				);
			}

			if (templateContent) {
				const emailTemplate = await ctx.db.createEmailTemplate({
					type: {
						connect: {id: type.id},
					},
					timing: 'euh',
					subject: templateContent.subject,
					content: templateContent.content,
					owner: {connect: {id: userId}},
				});

				ctx.db.updateEmailType({
					where: {id: type.id},
					data: {
						emailTemplates: {connect: {id: emailTemplate.id}},
					},
				});
			}
		});
	}
};

module.exports = {
	createTemplates,
};
