const Section = {
	id: node => node.id,
	name: node => node.name,
	items: (node, args, ctx) => ctx.db.section({id: node.id}).items(),
};

module.exports = {
	Section,
};
