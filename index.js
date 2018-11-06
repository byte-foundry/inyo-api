const {GraphQLServer} = require('graphql-yoga');
const {ApolloEngine} = require('apollo-engine');
const {formatError} = require('apollo-errors');
const bodyParser = require('body-parser');

const {prisma} = require('./generated/prisma-client');
const {resolvers} = require('./resolvers');
const sendEmail = require('./emails/SendEmail.js');

const {PORT} = process.env;

const server = new GraphQLServer({
	typeDefs: 'schema.graphql',
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

server.express.get('/send-reminder', (req, res) => res.status(200).send('bonjour'));

server.express.post('/send-reminder', bodyParser.json(), async (req, res) => {
	const hmac = require('crypto').createHmac(
		'sha256',
		process.env.POSTHOOK_SIGNATURE,
	);

	console.log('############ SEND REMINDER CALLED ##########');
	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));
	console.log('############ HMAC UPDATE DONE ##########');
	const hmacSignature = hmac.digest('hex');

	console.log('############ HMAC PREPARING TO COMPARE##########');
	console.log(`check: ${hmacSignature}, sent: ${req.get('x-ph-signature')}`);

	if (hmacSignature !== req.get('x-ph-signature')) {
		throw new Error('The signature has not been verified.');
	}

	const [reminder] = await prisma.reminders({where: {postHookId: req.body.id}});

	try {
		await sendEmail(req.body.data);
		await prisma.updateReminder({
			where: {id: reminder.id},
			data: {
				status: 'SENT',
			},
		});
		console.log(
			`${new Date().toISOString()}: Reminder with id ${reminder.id} sent`,
		);
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
		console.log(
			`${new Date().toISOString()}: Reminder with id ${
				reminder.id
			} not sent with error ${error}`,
		);
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
			formatError,
		},
		() => console.log(
			`Server with Apollo Engine is running on http://localhost:${PORT}`,
		),
	);
}
else {
	server.start({port: PORT, tracing: 'enabled', formatError}, () => console.log(
		`Server with Apollo Engine is running on http://localhost:${PORT}`,
	));
}
