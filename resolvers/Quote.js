const Quote = {
  id: node => node.id,
  issuer: (node, args, ctx) => ctx.db.quote({ id: node.id }).issuer(),
  customer: (node, args, ctx) => ctx.db.quote({ id: node.id }).customer(),
  status: node => node.status,
  // items: (node, args, ctx) => ctx.db.quote({ id: node.id }).items(),
  issuedAt: node => node.issuedAt,
  createdAt: node => node.createdAt,
  updatedAt: node => node.updatedAt,
}

module.exports = {
  Quote,
}
