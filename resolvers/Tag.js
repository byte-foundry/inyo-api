const Tag = {
	id: node => node.id,
	name: node => node.name,
	colorBg: node => node.colorBg,
	colorText: node => node.colorText,
	items: (node, args, ctx) => ctx.db.tag({id: node.id}).items(),
};

module.exports = {
	Tag,
};
