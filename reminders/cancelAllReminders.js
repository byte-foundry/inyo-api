var https = require("https");
const cancelReminder = require('./cancelReminder.js');

var options = {
  "method": "GET",
  "hostname": "api.posthook.io",
  "path": "/v1/hooks",
  "headers": {
    "X-API-Key": process.env.POSTHOOK_API_KEY,
  }
};

var req = https.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = JSON.parse(Buffer.concat(chunks).toString());
    body.data.forEach(async (hook) => {
      try {
        await cancelReminder(hook.id);
        console.log(`${hook.id} canceled`);
      }
      catch (error) {
        console.log(`${hook.id} errored`);
      }
    });
  });
});

req.end();
