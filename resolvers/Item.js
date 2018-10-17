const Item = {
  id: node => node.id,
  name: node => node.name,
  unitPrice: node => node.unitPrice,
  pendingUnitPrice: node => node.pendingUnitPrice,
  unit: node => node.unit || 'TIME',
  // comments: [Comment!]!
  vatRate: node => node.vatRate,
  status: node => node.status || 'PENDING',
}

module.exports = {
  Item,
}