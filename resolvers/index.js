const { Query } = require('./Query')
const { Mutation } = require('./Mutation')
const { AuthPayload } = require('./AuthPayload')
const { User } = require('./User')
const { Company } = require('./Company')
const { Quote } = require('./Quote')
const { Customer } = require('./Customer')
const { Address } = require('./Address')

const resolvers = {
  Query,
  Mutation,
  AuthPayload,
  User,
  Company,
  Quote,
  Address,
}

module.exports = {
  resolvers,
}
