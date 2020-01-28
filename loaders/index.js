const Dataloader = require('dataloader');

const {prisma} = require('../generated/prisma-client');
const {
	batchGetItemById,
	batchGetItemByReminderId,
	batchGetItemByTagId,
} = require('./items');
const {
	batchGetUserById,
	batchGetUserByTaskId,
	batchGetCollaboratorsByProjectId,
} = require('./users');
const {
	batchGetCustomerById,
	batchGetCustomerByToken,
	batchGetCustomerByTaskId,
} = require('./customers');
const {batchGetSectionById, batchGetSectionByItemId} = require('./sections');
const {
	batchGetProjectById,
	batchGetProjectByToken,
	batchGetProjectBySectionId,
} = require('./projects');
const {batchGetTagById} = require('./tags');
const {batchGetEmailParamById} = require('./emailParams');
const {batchGetEmailParamForTypeById} = require('./emailParamForTypes');
const {batchGetEmailTypeById} = require('./emailTypes');
const {batchGetFileById} = require('./files');
const {batchGetCommentById} = require('./comments');
const {batchGetCommentViewById} = require('./commentViews');
const {batchGetReminderById} = require('./reminders');

const createLoaders = () => {
	const db = prisma;

	return {
		itemLoader: new Dataloader(ids => batchGetItemById(ids, db)),
		userLoader: new Dataloader(ids => batchGetUserById(ids, db)),
		projectLoader: new Dataloader(tokens => batchGetProjectById(tokens, db)),
		projectTokenLoader: new Dataloader(tokens => batchGetProjectByToken(tokens, db)),
		customerLoader: new Dataloader(ids => batchGetCustomerById(ids, db)),
		customerTokenLoader: new Dataloader(ids => batchGetCustomerByToken(ids, db)),
		sectionLoader: new Dataloader(ids => batchGetSectionById(ids, db)),
		tagLoader: new Dataloader(ids => batchGetTagById(ids, db)),
		emailParamLoader: new Dataloader(ids => batchGetEmailParamById(ids, db)),
		emailParamForTypeLoader: new Dataloader(ids => batchGetEmailParamForTypeById(ids, db)),
		emailTypeLoader: new Dataloader(ids => batchGetEmailTypeById(ids, db)),
		fileLoader: new Dataloader(ids => batchGetFileById(ids, db)),
		commentLoader: new Dataloader(ids => batchGetCommentById(ids, db)),
		commentViewLoader: new Dataloader(ids => batchGetCommentViewById(ids, db)),
		reminderLoader: new Dataloader(ids => batchGetReminderById(ids, db)),
		sections: {
			byItemId: new Dataloader(ids => batchGetSectionByItemId(ids, db)),
		},
		projects: {
			bySectionId: new Dataloader(ids => batchGetProjectBySectionId(ids, db)),
		},
		items: {
			byReminderId: new Dataloader(ids => batchGetItemByReminderId(ids, db)),
			byTagId: new Dataloader(ids => batchGetItemByTagId(ids, db)),
		},
		users: {
			byTaskId: new Dataloader(ids => batchGetUserByTaskId(ids, db)),
			collaboratorsByProjectId: new Dataloader(ids => batchGetCollaboratorsByProjectId(ids, db)),
		},
		customers: {
			byTaskId: new Dataloader(ids => batchGetCustomerByTaskId(ids, db)),
		},
	};
};

module.exports = {
	createLoaders,
};
