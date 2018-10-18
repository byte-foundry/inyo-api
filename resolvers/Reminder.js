const Reminder = {
  id: node => node.id,
  quote: (node, args, ctx) => ctx.db.reminder({id: node.id}).quote(),
  postHookId: node => node.postHookId,
  type: node => node.type,
  sendingDate: node => node.sendingDate,
}

module.exports = {
  Section,
}
