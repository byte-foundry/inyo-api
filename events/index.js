const {sendCustomersRecapEmail} = require('./sendCustomersRecapEmail');
const {sendReminderEmail} = require('./sendReminderEmail');
const {
	sendDeadlineApproachingEmail,
} = require('./sendDeadlineApproachingEmail');

module.exports = {
	sendCustomersRecapEmail,
	sendReminderEmail,
	sendDeadlineApproachingEmail,
};
