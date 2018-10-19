const Quote = {
  id: node => node.id,
  name: node => node.name,
  template: node => node.template,
  issuer: (node, args, ctx) => ctx.db.quote({ id: node.id }).issuer(),
  customer: (node, args, ctx) => ctx.db.quote({ id: node.id }).customer(),
  issuer: (node, args, ctx) => ctx.db.quote({ id: node.id }).customer().serviceCompany(),
  status: node => node.status,
  options: (node, args, ctx) => ctx.db.quote({ id: node.id }).options(),
  viewedByCustomer: node => node.viewedByCustomer,
  issuedAt: node => node.issuedAt,
  createdAt: node => node.createdAt,
  updatedAt: node => node.updatedAt,
}

module.exports = {
  Quote,
}
