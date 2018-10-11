const Company = {
  id: node => node.id,
  name: node => node.name,
  owner: (node, args, ctx) => ctx.db.company({ id: node.id }).owner(),
  email: node => node.email,
  address: (node, args, ctx) => ctx.db.company({ id: node.id }).address(),
  phone: node => node.phone,
  siret: node => node.siret,
  rcs: node => node.rcs,
  rm: node => node.rm,
  vat: node => node.vat,
  customers: (node, args, ctx) => ctx.db.company({ id: node.id }).customers(),
  quotes: (node, args, ctx) => ctx.db.company({ id: node.id }).quotes(),
}

module.exports = {
  Company,
}
