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
                email: email
              }
            ],
            dynamic_template_data: data
          }
        ],
        template_id: templateId,
      }
    };

    try {
      const [response, body] = await sendGridClient.request(request)
    }
    catch (errors) {
      throw new Error(errors[0].message);
    }

    return [response, body];
}

module.exports = sendEmail;
