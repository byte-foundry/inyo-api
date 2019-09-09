const {getUserId} = require('../utils.js');
const {templateTable} = require('../translations/templateTable');

function getTemplateId(id, ctx) {
	const userId = getUserId(ctx);
	const [settings] = ctx.db.settingses({
		where: {
			user: {
				id: userId,
			},
		},
	});

	return templateTable[id][settings.language];
}

module.exports = getTemplateId;
