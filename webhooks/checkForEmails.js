const {google} = require('googleapis');
const {Duplex} = require('stream');
const fs = require('fs');
const readline = require('readline');
const {simpleParser} = require('mailparser');
const replyParser = require('node-email-reply-parser');

const {storeUpload} = require('../files');
const {postComment} = require('../resolvers/postComment');
const {prisma} = require('../generated/prisma-client');

// If modifying these scopes, delete token.json.
const SCOPES = [
	'https://www.googleapis.com/auth/gmail.readonly',
	'https://www.googleapis.com/auth/gmail.modify',
];
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

let emailClient;

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
		const authClient = oAuth2Client;
		emailClient = google.gmail({version: 'v1', auth: authClient});
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
function checkForEmails() {
	const gmail = emailClient;
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
						format: 'raw',
					});
					const messageObject = await simpleParser(
						Buffer.from(message.data.raw, 'base64').toString('utf-8'),
					);

					const messageContent = replyParser(
						messageObject.text,
					).getVisibleText();

					const taskId = messageObject.to.value[0].address.match(
						/\+([a-z0-9]*)@/,
					)[1];
					const fromEmail = messageObject.from.value[0].address;

					const [user] = await prisma.users({
						where: {
							email: fromEmail,
							OR: [
								{
									tasks_some: {
										id: taskId,
									},
								},
								{
									assignedTasks_some: {
										id: taskId,
									},
								},
							],
						},
					});

					const [customer] = await prisma.customers({
						where: {
							email: fromEmail,
							OR: [
								{linkedTasks_some: {id: taskId}},
								{projects_some: {sections_some: {items_some: {id: taskId}}}},
							],
						},
					});

					if (!user && !customer) {
						console.log(
							`When checking email for comment reply, email from ${fromEmail} does not match a user or a customer`,
						);

						await gmail.users.messages.modify({
							userId: 'me',
							id,
							requestBody: {
								removeLabelIds: ['UNREAD'],
							},
						});

						return true;
					}

					await Promise.all(
						messageObject.attachments.map(async (attachment) => {
							const stream = new Duplex();
							stream.push(attachment.content);
							stream.push(null);

							const {
								Location, ETag, Bucket, Key,
							} = await storeUpload({
								stream,
								prefix: taskId,
								filename: attachment.filename,
								maxFileSize: Infinity,
							});

							const fileIntermediary = await prisma.createFile({
								filename: attachment.filename,
								mimetype: attachment.contentType,
								encoding: '7bit',
								url: Location,
							});

							const file = await prisma.updateFile({
								where: {id: fileIntermediary.id},
								data: {
									documentType: 'DEFAULT',
									linkedTask: {connect: {id: taskId}},
									ownerUser: user ? {connect: {id: user.id}} : undefined,
									ownerCustomer: customer
										? {connect: {id: customer.id}}
										: undefined,
								},
							});

							return file;
						}),
					);

					const ctx = {
						token: customer && customer.token,
						db: prisma,
						userId: user && user.id,
						language: 'fr',
					};

					postComment(
						undefined,
						{itemId: taskId, comment: {text: messageContent}},
						ctx,
					);

					await gmail.users.messages.modify({
						userId: 'me',
						id,
						requestBody: {
							removeLabelIds: ['UNREAD'],
						},
					});

					return true;
				});
			}
			else {
				console.log('No emails found.');
			}
		},
	);
}

module.exports = {
	checkForEmails,
};
