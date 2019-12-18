const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const updateEmailTemplate = async (
	parent,
	{
		id, timing, subject, content, usedParameters,
	},
	ctx,
) => {
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
	});

	if (!template) {
		throw new NotFoundError(`Template '${id}' has not been found.`);
	}

	const updatedTemplate = await ctx.db.updateEmailTemplate({
		where: {id},
		data: {
			timing,
			subject,
			content,
		},
	});

	return updatedTemplate;
};

module.exports = {
	updateEmailTemplate,
};
