const Tag = {
	id: node => node.id,
	name: node => node.name,
	color: node => node.color,
	item: (node, args, ctx) => ctx.db.tag({id: node.id}).item(),
	user: (node, args, ctx) => ctx.db.tag({id: node.id}).user(),
};

module.exports = {
	Tag,
};
