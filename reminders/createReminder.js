const https = require('https');

function createReminder(mutation) {
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

module.exports = createReminder;
