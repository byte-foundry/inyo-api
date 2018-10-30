const User = {
  id: node => node.id,
  email: node => node.email,
  firstName: node => node.firstName,
  lastName: node => node.lastName,
  company: (node, args, ctx) => ctx.db.user({ id: node.id }).company(),
  defaultDailyPrice: node => node.defaultDailyPrice,
  defaultVatRate: node => node.defaultVatRate,
  workingFields: node => node.workingFields,
  jobType: node => node.jobType,
  interestedFeatures: node => node.interestedFeatures,
  hasUpcomingProject: node => node.hasUpcomingProject,
}

module.exports = {
  User,
}
