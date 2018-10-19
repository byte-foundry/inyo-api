const Item = {
  id: node => node.id,
  name: node => node.name,
  unitPrice: node => node.unitPrice,
  pendingUnit: node => node.pendingUnit,
  unit: node => node.unit,
  comments: (node, args, ctx) => [{
    text: "Wow, that's a nice tnetennba",
    author: ctx.db.customer({ id: "cjng2gfnh06fp0810t40ub52h" }),
  }, {
    text: "I know right? I made it myself!",
    author: ctx.db.user({ id: "cjn3eo6ek00ig0810k2ub7zpa" }),
  }],
  vatRate: node => node.vatRate,
  status: node => node.status || 'PENDING',
}

module.exports = {
  Item,
}