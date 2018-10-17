const Option = {
  id: node => node.id,
  name: node => node.name,
  proposal: node => node.proposal || '',
  sections: (node, args, ctx) => ctx.db.option({ id: node.id }).sections(),
}

module.exports = {
  Option,
}