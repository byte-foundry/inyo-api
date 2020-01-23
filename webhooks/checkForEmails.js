const {google} = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const replyParser = require('node-email-reply-parser');

const {prisma} = require('../generated/prisma-client');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);
	// Authorize a client with credentials, then call the Gmail API.
	authorize(JSON.parse(content));
});

let authClient;

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0],
	);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client);
		oAuth2Client.setCredentials(JSON.parse(token));
		authClient = oAuth2Client;
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log('Token stored to', TOKEN_PATH);
			});
		});
	});
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels() {
	const gmail = google.gmail({version: 'v1', authClient});
	gmail.users.messages.list(
		{
			userId: 'me',
			q: 'to:suivi is:unread {subject:commented subject:commentaire}',
		},
		(err, res) => {
			if (err) return console.log(`The API returned an error: ${err}`);
			const {messages} = res.data;
			if (messages) {
				messages.forEach(async ({id}) => {
					const message = await gmail.users.messages.get({
						userId: 'me',
						id,
					});
					const to = message.data.payload.headers.find(
						header => header.name === 'To',
					).value;
					const from = message.data.payload.headers.find(
						header => header.name === 'From',
					).value;
					const messageContent = replyParser(
						Buffer.from(
							message.data.payload.parts[0].body.data,
							'base64',
						).toString('utf-8'),
					).getVisibleText();

					console.log(to);
					console.log(from);
					console.log(messageContent);
				});
			}
			else {
				console.log('No labels found.');
			}
		},
	);
}

module.exports = {
	checkForEmails: listLabels,
};
