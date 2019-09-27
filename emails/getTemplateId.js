const {templateTable} = require('../translations/templateTable');

function getTemplateId(id, ctx) {
	if (!templateTable[id]) {
		console.log(
			`Template ${id} seems to be missing from the template table list, falling back to the given id.`,
		);
		return id;
	}

	if (!templateTable[id][ctx.language]) {
		console.log(
			`[${
				ctx.language
			}] version of template ${id} seems to be missing from the template table list, falling back to the given id.`,
		);
		return id;
	}

	return templateTable[id][ctx.language];
}

module.exports = getTemplateId;
