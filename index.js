const crypto = require('crypto');
const {GraphQLServer} = require('graphql-yoga');
const {ApolloEngine} = require('apollo-engine');
const bodyParser = require('body-parser');
const {DeprecatedDirective} = require('graphql-directive-deprecated');

const {prisma} = require('./generated/prisma-client');
const {resolvers} = require('./resolvers');
const {posthookReceiver} = require('./webhooks/posthookReceiver');
const {scheduleDailyMails} = require('./webhooks/scheduleDailyMails');
const sendEmail = require('./emails/SendEmail');

const {PORT} = process.env;

const server = new GraphQLServer({
	typeDefs: 'schema.graphql',
	schemaDirectives: {
		deprecated: DeprecatedDirective,
	},
	resolvers,
	context: (req) => {
		const {request} = req;
		const xForwardedFor = (request.headers['x-forwarded-for'] || '').replace(
			/:\d+$/,
			'',
		);
		const ip = xForwardedFor || request.connection.remoteAddress;

		return {
			...req,
			db: prisma,
			ip,
		};
	},
});

server.express.post('/schedule-daily-mails', scheduleDailyMails);

server.express.post('/posthook-receiver', bodyParser.json(), posthookReceiver);

server.express.post('/send-reminder', bodyParser.json(), async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));
	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		throw new Error('The signature has not been verified.');
	}

	const [reminder] = await prisma.reminders({
		where: {
			postHookId: req.body.id,
			OR: [
				{
					status_not: 'SENT',
				},
				{
					status_not: 'CANCELED',
				},
			],
		},
	});

	if (!reminder) {
		console.log(`'${req.body.id}' is not a pending reminder. Aborting.`);
		res.status(200).send();
		return;
	}

	try {
		await sendEmail(req.body.data);

		await prisma.updateReminder({
			where: {id: reminder.id},
			data: {
				status: 'SENT',
			},
		});
		console.log(`Reminder '${reminder.id}' sent.`);

		// posthook wants a 200 not a 204
		res.status(200).send();
	}
	catch (error) {
		await prisma.updateReminder({
			where: {id: reminder.id},
			data: {
				status: 'ERROR',
			},
		});
		console.log(`Reminder '${reminder.id}' not sent.`, error);

		res.status(500).send({
			message: 'Something wrong happened!',
		});
	}
});

if (process.env.APOLLO_ENGINE_KEY) {
	const engine = new ApolloEngine({
		apiKey: process.env.APOLLO_ENGINE_KEY,
	});

	const httpServer = server.createHttpServer({
		tracing: true,
		cacheControl: true,
	});

	engine.listen(
		{
			port: PORT,
			httpServer,
			graphqlPaths: ['/'],
		},
		() => console.log(
			`Server with Apollo Engine is running on http://localhost:${PORT}`,
		),
	);
}
else {
	server.start({port: PORT, tracing: 'enabled'}, () => console.log(
		`Server with Apollo Engine is running on http://localhost:${PORT}`,
	));
}
