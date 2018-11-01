const {Query} = require('./Query');
const {Mutation} = require('./Mutation');
const {AuthPayload} = require('./AuthPayload');
const {User} = require('./User');
const {Company} = require('./Company');
const {Item} = require('./Item');
const {Section} = require('./Section');
const {Option} = require('./Option');
const {Quote} = require('./Quote');
const {Customer} = require('./Customer');
const {Address} = require('./Address');
const {Author} = require('./Author');
const {Comment} = require('./Comment');
const {Viewer} = require('./Viewer');
const {CommentView} = require('./CommentView');
const {File} = require('./File');

const resolvers = {
	Query,
	Mutation,
	AuthPayload,
	User,
	Company,
	Item,
	Section,
	Option,
	Quote,
	Customer,
	Address,
	Author,
	Comment,
	Viewer,
	CommentView,
	File,
};

module.exports = {
	resolvers,
};
