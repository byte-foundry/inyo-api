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
const {Project} = require('./Project');
const {Customer} = require('./Customer');
const {Address} = require('./Address');
const {Author} = require('./Author');
const {Owner} = require('./Owner');
const {Comment} = require('./Comment');
const {Viewer} = require('./Viewer');
const {CommentView} = require('./CommentView');
const {File} = require('./File');
const {Reminder} = require('./Reminder');
const {Notification} = require('./Notification');
const {NotificationEmitter} = require('./NotificationEmitter');
const {NotificationObject} = require('./NotificationObject');

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
	Option: () => {
		throw new Error('Quotes are not supported anymore');
	},
	Project,
	Quote: () => {
		throw new Error('Quotes are not supported anymore');
	},
	Customer,
	Address,
	Author,
	Owner,
	Comment,
	Viewer,
	CommentView,
	File,
	Reminder,
	NotificationEmitter,
	NotificationObject,
	Notification,
};

module.exports = {
	resolvers,
};
