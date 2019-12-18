const gql = String.raw;

const {getUserId} = require('../utils');
const {getDefaultTemplate} = require('../emails/templates');
const {NotFoundError} = require('../errors');

const setTemplateToDefault = async (parent, {id}, ctx) => {
	const userId = getUserId(ctx);
	const [template] = await ctx.db.emailTemplates({
		where: {
			AND: [
				{id},
				{
					owner: {
						id: userId,
					},
				},
			],
		},
	}).$fragment(gql`
		fragment TemplateWithType on EmailTemplate {
			id
			type {
				id
				name
				category
			}
		}
	`);

	if (!template) {
		throw new NotFoundError(`Template '${id}' has not been found.`);
	}

	const defaultTemplate = getDefaultTemplate(
		template.type.category,
		template.type.name,
		ctx.language,
	);

	const updatedTemplate = await ctx.db.updateEmailTemplate({
		where: {id},
		data: defaultTemplate,
	});

	return updatedTemplate;
};

module.exports = {
	setTemplateToDefault,
};
