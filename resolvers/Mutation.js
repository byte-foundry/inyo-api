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
const {removeProject} = require('./removeProject');
const {addSection} = require('./addSection');
const {updateSection} = require('./updateSection');
const {removeSection} = require('./removeSection');
const {addItem} = require('./addItem');
const {updateItem} = require('./updateItem');
const {focusTask} = require('./focusTask');
const {unfocusTask} = require('./unfocusTask');
const {startTaskTimer} = require('./startTaskTimer');
const {stopCurrentTaskTimer} = require('./stopCurrentTaskTimer');
const {clearTaskWorkedTimes} = require('./clearTaskWorkedTimes');
const {removeItem} = require('./removeItem');
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
const {createTag} = require('./createTag');
const {updateTag} = require('./updateTag');
const {removeTag} = require('./removeTag');
const {requestCollab} = require('./requestCollab');
const {removeCollab} = require('./removeCollab');
const {acceptCollabRequest} = require('./acceptCollabRequest');
const {rejectCollabRequest} = require('./rejectCollabRequest');
const {cancelRequestCollab} = require('./cancelRequestCollab');
const {assignToTask} = require('./assignToTask');
const {linkToProject} = require('./linkToProject');
const {removeAssignmentToTask} = require('./removeAssignmentToTask');
const {removeLinkToProject} = require('./removeLinkToProject');
const {sendReminderTestEmail} = require('./sendReminderTestEmail');
const {
	sendReminderPreviewTestEmail,
} = require('./sendReminderPreviewTestEmail');
const {sendCustomEmailPreview} = require('./sendCustomEmailPreview');
const {markNotificationsAsRead} = require('./markNotificationsAsRead');
const {updateEmailTemplate} = require('./updateEmailTemplate');
const {setTemplateToDefault} = require('./setTemplateToDefault');
const {issueQuote} = require('./issueQuote');
const {acceptQuote} = require('./acceptQuote');

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
	addSection,
	updateSection,
	removeSection,
	addItem,
	updateItem,
	focusTask,
	unfocusTask,
	startTaskTimer,
	stopCurrentTaskTimer,
	clearTaskWorkedTimes,
	removeItem,
	snoozeItem() {
		throw Error('Tasks cannot be snoozed anymore.');
	},
	unsnoozeItem() {
		throw Error('Tasks cannot be unsnoozed anymore.');
	},
	finishItem,
	unfinishItem,
	postComment,
	uploadAttachments,
	updateFile,
	removeFile,
	cancelReminder,
	createTag,
	updateTag,
	removeTag,
	sendReminderTestEmail,
	sendReminderPreviewTestEmail,
	sendCustomEmailPreview,
	markNotificationsAsRead,
	requestCollab,
	removeCollab,
	acceptCollabRequest,
	rejectCollabRequest,
	cancelRequestCollab,
	assignToTask,
	linkToProject,
	removeAssignmentToTask,
	removeLinkToProject,
	updateEmailTemplate,
	setTemplateToDefault,
	issueQuote,
	acceptQuote,
};

module.exports = {
	Mutation,
};
