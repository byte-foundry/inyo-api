const uuid = require('uuid/v4');

const gql = String.raw;

const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');

const updateEmailTemplate = async (
	parent,
	{
		id, timing, subject, content, usedParameters,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const [template] = await ctx.db.items({
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
		id
	`);

	if (!template) {
		throw new NotFoundError(`Template '${id}' has not been found.`);
	}

	const updatedTemplate = await ctx.db.updateTemplate({
		where: {id},
		data: {
			subject,
			content,
		},
	});

	return updatedTemplate;
};

module.exports = {
	updateEmailTemplate,
};
