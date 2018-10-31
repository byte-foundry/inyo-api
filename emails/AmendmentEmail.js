const sendEmail = require('./SendEmail.js');
const createReminder = require('../reminders/createReminder.js');
const moment = require('moment');


async function sendAmendmentEmail({email, user, customerName, projectName, quoteUrl, items}) {
    return sendEmail({email, data: {user, customerName, projectName, quoteUrl, items}, templateId: 'd-89e93a0c04994a70afd1c2eb0304f281'});
}

async function setupAmendmentReminderEmail({
  email,
  user,
  customerName,
  projectName,
  quoteUrl,
  quoteId,
  issueDate,
	items,
}, ctx) {
  const dates = [
    /*after5days*/{
      date: moment(issueDate).add(5, 'days'),
      templateId: 'd-9fa98f7797d3481bb051cb7fd49ca343',
      reminderType: 'AMENDMENT_AFTER_5_DAYS',
    },
    /*after10days*/{
      date: moment(issueDate).add(10, 'days'),
      templateId: 'd-9f2a00fcf53142fbaa9a1a34cee0ff59',
      reminderType: 'AMENDMENT_AFTER_10_DAYS',
    },
  ];

  dates.forEach(async ({date, templateId, reminderType}) => {
    try {
      const data = await createReminder({
        email,
        templateId,
        data: {
          user,
          customerName,
          projectName,
          quoteUrl,
          items,
        },
        postDate: date.format(),
      });

      const reminder = await ctx.db.createReminder({
        quote: {
          connect: {id: quoteId},
        },
        postHookId: data.data.id,
        type: reminderType,
        sendingDate: date.format(),
        status: 'PENDING',
      });

      console.log(`${new Date().toISOString()}: Reminder with posthook id ${data.data.id} of type ${reminderType} created`);
    }
    catch (error) {
      //Here we should do something to store the errors
      console.log(`${new Date().toISOString()}: Reminder with posthook id ${data.data.id} of type ${reminderType} not created with error ${error}`);
    }
  });
}

module.exports = {
  sendAmendmentEmail,
  setupAmendmentReminderEmail,
}
