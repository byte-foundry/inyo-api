const moment = require('moment');
const createReminder = require('../reminders/createReminder.js');

const issueDate = moment();
const [{date, templateId}] = [
	{
	  date: moment(issueDate).add(1, 'minutes'),
	  templateId: 'd-8228bc7ebb18488baf2e850a54268e23',
	  reminderType: 'QUOTE_AFTER_10_DAYS',
	},
];

createReminder({
	email: 'francois.poizat@gmail.com',
	templateId,
	data: {
		user: 'user',
		customerName: 'customer',
		projectName: 'project',
		quoteUrl: 'https://yahoo.fr',
	},
	postDate: date.format(),
});
