const https = require('https');
const sendGridClient = require('@sendgrid/client');

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({email, data, templateId}) {
    const request = {
      method: 'POST',
      url: '/v3/mail/send',
      body: {
        from:{
          email: "edwige@inyo.me"
        },
        personalizations: [
          {
            to:[
              {
                email
              }
            ],
            dynamic_template_data: data
          }
        ],
        template_id: templateId,
      }
    };

    const [response, body] = await sendGridClient.request(request)

    return [response, body];
}

module.exports = sendEmail;
