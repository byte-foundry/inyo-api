const {templateTable} = require('../translations/templateTable');

function getTemplateId(id, ctx) {
	return templateTable[id][ctx.language];
}

module.exports = getTemplateId;
