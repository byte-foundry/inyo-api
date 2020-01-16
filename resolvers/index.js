const {GraphQLTime, GraphQLDate} = require('graphql-iso-date');

const {GraphQLTimeZone} = require('../types/timezone');
const {Query} = require('./Query');
const {Mutation} = require('./Mutation');
const {AuthPayload} = require('./AuthPayload');
const {User} = require('./User');
const {Settings} = require('./Settings');
const {CollabRequest} = require('./CollabRequest');
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
const {Tag} = require('./Tag');
const {DeadlineObject} = require('./DeadlineObject');
const {ScheduleDay} = require('./ScheduleDay');
const {Event} = require('./Event');
const {EventEmitter} = require('./EventEmitter');
const {EventObject} = require('./EventObject');
const {EventSubject} = require('./EventSubject');
const {ExternalImage} = require('./ExternalImage');
const {EmailType} = require('./EmailType');
const {EmailParam} = require('./EmailParam');
const {EmailParamForType} = require('./EmailParamForType');
const {EmailTemplate} = require('./EmailTemplate');
const {Quote} = require('./Quote');
const {QuoteSection} = require('./QuoteSection');
const {QuoteItem} = require('./QuoteItem');

const resolvers = {
	TimeZone: GraphQLTimeZone,
	Time: GraphQLTime,
	Date: GraphQLDate,
	Query,
	Mutation,
	AuthPayload,
	User,
	Settings,
	CollabRequest,
	Company,
	Item,
	Section,
	Project,
	Quote,
	QuoteSection,
	QuoteItem,
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
	Tag,
	DeadlineObject,
	ScheduleDay,
	Event,
	EventEmitter,
	EventObject,
	EventSubject,
	ExternalImage,
	EmailType,
	EmailParam,
	EmailParamForType,
	EmailTemplate,
};

module.exports = {
	resolvers,
};
