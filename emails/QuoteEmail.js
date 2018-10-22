const https = require('https');
const sendEmail = require('./SendEmail.js');


async function sendQuoteEmail({email, user, customerName, projectName, quoteUrl}) {
    return sendEmail({email, {user, customerName, projectName},'d-5055ed1a146348d9bd8cc440bf1160d8');
}

function createReminder({
  email, user, customerName, projectName, quoteUrl, templateId, postDate
}) {
  return new Promise((resolve, reject) => {

    const options = {
      method: "POST",
      hostname: "api.posthook.io",
      path: "/v1/hooks",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.POSTHOOK_API_KEY
      }
    };

    const req = https.request(options, function (res) {
      const chunks = [];

      console.log(res.statusCode);

      if (res.statusCode === 400) {
        // Bad request
        // Alert us
        reject(res.statusCode);
      }

      if (res.statusCode === 401) {
        // Unauthorized
        // Problem with API key
        reject(res.statusCode);
      }

      if (res.statusCode === 413) {
        // too large
        // Alert user
        reject(res.statusCode);
      }

      if (res.statusCode === 429) {
        // Quota exceeded
        // Alert us
        reject(res.statusCode);
      }

      if (res.statusCode === 500) {
        // Internal server error
        // Alert posthook
        reject(res.statusCode);
      }

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        const body = Buffer.concat(chunks);
        const response = JSON.parse(body.toString());
        resolve(response);
      });
    });

    req.write(JSON.stringify({
      path: '/send-reminder-email',
      postAt: postDate,
      data: { email, user, customerName, projectName, quoteUrl, templateId }
    }));
    req.end();
  });
}

async function setupQuoteReminderEmail({email, user, customerName, projectName, quoteUrl, issueDate}) {
  const oneMonthDate = moment(issueDate).add(1, 'months');
  const twoMonthDate = moment(issueDate).add(2, 'months');
  const endDate = moment(issueDate).add(3, 'months');
  const twentyDaysLeft = moment(endDate).subtract(20, 'days');
  const tenDaysLeft = moment(endDate).subtract(10, 'days');
  const fiveDaysLeft = moment(endDate).subtract(5, 'days');

  console.log(issueDate.format());
  console.log(oneMonthDate.format());

  createReminder({
    email,
    user,
    customerName,
    projectName,
    quoteUrl,
    postDate: oneMonthDate.format(),
  });
}

module.exports = {
  sendQuoteEmail,
  setupQuoteReminderEmail,
}
