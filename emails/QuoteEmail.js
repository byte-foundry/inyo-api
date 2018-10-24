const sendEmail = require('./SendEmail.js');
const createReminder = require('../reminders/createReminder.js');
const moment = require('moment');


async function sendQuoteEmail({email, user, customerName, projectName, quoteUrl}) {
    return sendEmail({email, data: {user, customerName, projectName}, templateId: 'd-5055ed1a146348d9bd8cc440bf1160d8'});
}

async function setupQuoteReminderEmail({
  email,
  user,
  customerName,
  projectName,
  quoteUrl,
  issueDate
}, ctx) {
  const endDate = moment(issueDate).add(3, 'months');
  const dates = [
    /*after10days*/{
      date: moment(issueDate).add(10, 'days'),
      templateId: 'd-8228bc7ebb18488baf2e850a54268e23',
      reminderType: 'QUOTE_AFTER_10_DAYS',
    },
    /*after15days*/{
      date: moment(issueDate).add(15, 'days'),
      templateId: 'd-a1bc360655554aea9f3af64024865c54',
      reminderType: 'QUOTE_AFTER_15_DAYS',
    },
    /*after20days*/{
      date: moment(issueDate).add(20, 'days'),
      templateId: 'd-fd44a9b741854602b967d1a56e792f5d',
      reminderType: 'QUOTE_AFTER_20_DAYS',
    },
    /*fiveDaysLeft*/{
      date: moment(endDate).subtract(5, 'days'),
      templateId: 'd-7d05e3c2c619442585b31c4facdd8524',
      reminderType: 'QUOTE_5_DAYS_LEFT',
    },
    /*twoDaysLeft*/{
      date: moment(endDate).subtract(2, 'days'),
      templateId: 'd-12dd15d3e7604ed99442d9cc1785f18a',
      reminderType: 'QUOTE_2_DAYS_LEFT',
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
        },
        postDate: date.format(),
      });

      const reminder = await ctx.db.createReminder({
        quote: {
          connect: quoteId,
        },
        postHookId: data.postHookId,
        type: reminderType,
        sendingDate: date.format(),
        status: 'SENT',
      });
    }
    catch (errors) {
      //Here we should do something to store the errors 
    }
  });
}

module.exports = {
  sendQuoteEmail,
  setupQuoteReminderEmail,
}
