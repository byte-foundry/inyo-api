const {GraphQLTime} = require('graphql-iso-date');

const {GraphQLTimeZone} = require('../types/timezone');
const {Query} = require('./Query');
const {Mutation} = require('./Mutation');
const {AuthPayload} = require('./AuthPayload');
const {User} = require('./User');
const {Settings} = require('./Settings');
const {Company} = require('./Company');
const {Item} = require('./Item');
const {Section} = require('./Section');
const {Option} = require('./Option');
const {Project} = require('./Project');
const {Quote} = require('./Quote');
const {Customer} = require('./Customer');
const {Address} = require('./Address');
const {Author} = require('./Author');
const {Comment} = require('./Comment');
const {Viewer} = require('./Viewer');
const {CommentView} = require('./CommentView');
const {File} = require('./File');
const {Reminder} = require('./Reminder');

const resolvers = {
	TimeZone: GraphQLTimeZone,
	Time: GraphQLTime,
	Query,
	Mutation,
	AuthPayload,
	User,
	Settings,
	Company,
	Item,
	Section,
	Option,
	Project,
	Quote,
	Customer,
	Address,
	Author,
	Comment,
	Viewer,
	CommentView,
	File,
	Reminder,
};

module.exports = {
	resolvers,
};
