const Customer = {
  id: node => node.id,
  name: node => node.name,
  email: node => node.email,
  address: (node, args, ctx) => ctx.db.customer({ id: node.id }).address(),
  phone: node => node.phone,
  siret: node => node.siret,
  rcs: node => node.rcs,
  rm: node => node.rm,
  vat: node => node.vat,
}

module.exports = {
  Customer,
}
