const Author = {
  __resolveType(obj, context, info) {
    if(obj.name) {
      return 'Customer';
    } else {
      return 'User';
    }
  },
}

module.exports = {
  Author,
}