const {checkEmailAvailability} = require('./checkEmailAvailability');
const {signup} = require('./signup');
const {resetPassword} = require('./resetPassword');
const {login} = require('./login');
const {sendResetPassword} = require('./sendResetPassword');
const {checkResetPassword} = require('./checkResetPassword');
const {updatePassword} = require('./updatePassword');
const {updateUser} = require('./updateUser');
const {createProject} = require('./createProject');
const {updateProject} = require('./updateProject');
const {archiveProject} = require('./archiveProject');
const {unarchiveProject} = require('./unarchiveProject');
const {unremoveProject} = require('./unremoveProject');
const {removeProject} = require('./removeProject');
const {addSection} = require('./addSection');
const {updateSection} = require('./updateSection');
const {removeSection} = require('./removeSection');
const {addItem} = require('./addItem');
const {updateItem} = require('./updateItem');
const {focusTask} = require('./focusTask');
const {unfocusTask} = require('./unfocusTask');
const {removeItem} = require('./removeItem');
const {snoozeItem} = require('./snoozeItem');
const {unsnoozeItem} = require('./unsnoozeItem');
const {finishItem} = require('./finishItem');
const {unfinishItem} = require('./unfinishItem');
const {postComment} = require('./postComment');
const {uploadAttachments} = require('./uploadAttachments');
const {updateFile} = require('./updateFile');
const {removeFile} = require('./removeFile');
const {createCustomer} = require('./createCustomer');
const {updateCustomer} = require('./updateCustomer');
const {removeCustomer} = require('./removeCustomer');
const {cancelReminder} = require('./cancelReminder');
const {sendReminderTestEmail} = require('./sendReminderTestEmail');
const {
	sendReminderPreviewTestEmail,
} = require('./sendReminderPreviewTestEmail');

const Mutation = {
	checkEmailAvailability,
	signup,
	sendResetPassword,
	checkResetPassword,
	resetPassword,
	login,
	updatePassword,
	updateUser,
	createCustomer,
	updateCustomer,
	removeCustomer,
	createProject,
	updateProject,
	archiveProject,
	unarchiveProject,
	removeProject,
	unremoveProject,
	startProject: () => {
		throw Error("It's not possible to start a project anymore.");
	},
	createQuote: () => {
		throw Error("It's not possible to create quote anymore.");
	},
	updateQuote: () => {
		throw Error("It's not possible to update quote anymore.");
	},
	removeQuote: () => {
		throw Error("It's not possible to remove a quote anymore.");
	},
	updateOption: () => {
		throw Error("It's not possible to update quote options anymore.");
	},
	addSection,
	updateSection,
	removeSection,
	addItem,
	updateItem,
	focusTask,
	unfocusTask,
	updateValidatedItem: () => {
		throw Error('Validated item are not supported.');
	},
	removeItem,
	sendQuote: () => {
		throw Error("It's not possible to send quote anymore.");
	},
	snoozeItem,
	unsnoozeItem,
	finishItem,
	unfinishItem,
	sendAmendment: async () => {
		throw Error("It's not possible to send amendment anymore.");
	},
	acceptItem: () => {
		throw Error('Accepting item is not supported anymore');
	},
	rejectItem: () => {
		throw Error('Rejecting item is not supported anymore');
	},
	acceptQuote: () => {
		throw Error('Quotes are not supported anymore');
	},
	rejectQuote: () => {
		throw Error('Quotes are not supported anymore');
	},
	acceptAmendment: () => {
		throw Error('Amendments are not supported anymore');
	},
	rejectAmendment: () => {
		throw Error('Amendments are not supported anymore');
	},
	postComment,
	uploadAttachments,
	updateFile,
	removeFile,
	cancelReminder,
	sendReminderTestEmail,
	sendReminderPreviewTestEmail,
};

module.exports = {
	Mutation,
};
