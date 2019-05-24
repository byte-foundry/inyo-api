const {GraphQLServer} = require('graphql-yoga');
const {ApolloEngine} = require('apollo-engine');
const bodyParser = require('body-parser');
const {DeprecatedDirective} = require('graphql-directive-deprecated');

const {prisma} = require('./generated/prisma-client');
const {resolvers} = require('./resolvers');
const {posthookReceiver} = require('./webhooks/posthookReceiver');
const {scheduleDailyMails} = require('./webhooks/scheduleDailyMails');
const {updateIntercom} = require('./webhooks/updateIntercom');
const {subscribeToUpdateIntercom} = require('./intercomTracking');
const {notifyViewedProject} = require('./notifyViewedProject');

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
server.express.post('/update-intercom', updateIntercom);

server.express.post('/posthook-receiver', bodyParser.json(), posthookReceiver);

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

subscribeToUpdateIntercom(prisma);
notifyViewedProject(prisma);
