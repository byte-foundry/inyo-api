const Item = {
  id: node => node.id,
  name: node => node.name,
  unitPrice: node => node.unitPrice,
  pendingUnit: node => node.pendingUnit,
  unit: node => node.unit,
  // comments: [Comment!]!
  vatRate: node => node.vatRate,
  status: node => node.status || 'PENDING',
}

module.exports = {
  Item,
}