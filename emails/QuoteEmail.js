const sendEmail = require('./SendEmail.js');
const createReminder = require('../reminders/createReminder.js');


async function sendQuoteEmail({email, user, customerName, projectName, quoteUrl}) {
    return sendEmail({email, data: {user, customerName, projectName}, templateId: 'd-5055ed1a146348d9bd8cc440bf1160d8'});
}

async function setupQuoteReminderEmail({email, user, customerName, projectName, quoteUrl, issueDate}) {
  const dates = [
    /*after10days*/moment(issueDate).add(10, 'days'),
    /*after15days*/moment(issueDate).add(15, 'days'),
    /*after20days*/moment(issueDate).add(20, 'days'),
    /*endDate*/moment(issueDate).add(3, 'months'),
    /*fiveDaysLeft*/moment(endDate).subtract(5, 'days'),
    /*twoDaysLeft*/moment(endDate).subtract(2, 'days'),
  ];

  dates.forEach(async date => {
    try {
      await createReminder({
        email,
        user,
        customerName,
        projectName,
        quoteUrl,
        postDate: oneMonthDate.format(),
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
