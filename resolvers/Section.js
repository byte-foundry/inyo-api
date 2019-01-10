const Section = {
	id: node => node.id,
	name: node => node.name,
	items: (node, args, ctx) => ctx.db.section({id: node.id}).items({orderBy: 'position_ASC'}),
	project: (node, args, ctx) => ctx.db.section({id: node.id}).project(),
};

module.exports = {
	Section,
};
