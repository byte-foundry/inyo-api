const Comment = {
  text: node => node.text,
  author: (node, args, ctx) => {
    return node.authorUser || node.authorCustomer;
  },
}

module.exports = {
  Comment,
}