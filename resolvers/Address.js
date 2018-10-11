const Address = {
  number: node => node.number,
  street: node => node.street,
  city: node => node.city,
  postalCode: node => node.postalCode,
  country: node => node.country,
}

module.exports = {
  Address,
}