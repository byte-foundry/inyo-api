const {PhotoAPI} = require('./datasources/photo');
const {PhotoResolvers} = require('./resolvers/photo');

const dataSources = {PhotoAPI};
const resolvers = PhotoResolvers;

module.exports = {
	dataSources,
	resolvers,
};
