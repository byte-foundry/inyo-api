const {GraphQLServer} = require('graphql-yoga');
const {ApolloEngine} = require('apollo-engine');
const bodyParser = require('body-parser');
const {DeprecatedDirective} = require('graphql-directive-deprecated');
const {verify} = require('jsonwebtoken');

const {prisma} = require('./generated/prisma-client');
const {resolvers} = require('./resolvers');
const {permissions} = require('./permissions');
const {posthookReceiver} = require('./webhooks/posthookReceiver');
const {paymentFromStripe} = require('./webhooks/paymentFromStripe.js');
const {scheduleDailyMails} = require('./webhooks/scheduleDailyMails');
const {teardownAndSetupTest} = require('./cypress-setup/teardownAndSetupTest');
const {updateIntercom} = require('./webhooks/updateIntercom');
const {subscribeToUpdateIntercom} = require('./intercomTracking');
const {notifyViewedProject} = require('./notifyViewedProject');

const {PORT, APP_SECRET} = process.env;
const gql = String.raw;

const getUserId = (request) => {
	const Authorization = request.get('Authorization');

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');

		try {
			const verifiedToken = verify(token, APP_SECRET);

			return verifiedToken.userId;
		}
		catch (e) {
			return null;
		}
	}

	return null;
};

const getToken = request => request.get('tokenFromRequest') || null;

const server = new GraphQLServer({
	typeDefs: 'schema.graphql',
	schemaDirectives: {
		deprecated: DeprecatedDirective,
	},
	resolvers,
	middlewares: [permissions],
	context: async (req) => {
		const {request} = req;
		const xForwardedFor = (request.headers['x-forwarded-for'] || '').replace(
			/:\d+$/,
			'',
		);
		const ip = xForwardedFor || request.connection.remoteAddress;
		const userId = getUserId(request);
		const token = getToken(request);

		let language = 'fr';

		let timeZone = 'Europe/Paris';

		if (userId || token) {
			const [user] = await prisma.users({
				where: {
					OR: [
						{
							id: userId,
						},
						{
							company: {
								customers_some: {
									token,
								},
							},
						},
						{
							projects_some: {
								token,
							},
						},
					],
				},
			}).$fragment(gql`
				fragment UserSettings on User {
					timeZone
					settings {
						language
					}
				}
			`);

			// if the userId or token doesn't exist, user is not defined
			if (user) {
				timeZone = user.timeZone || 'Europe/Paris';
				language = user.settings.language || 'fr';
			}
		}

		return {
			...req,
			db: prisma,
			userId,
			language,
			timeZone,
			token,
			ip,
		};
	},
});

server.express.post('/schedule-daily-mails', scheduleDailyMails);
server.express.post('/update-intercom', updateIntercom);

server.express.post('/posthook-receiver', bodyParser.json(), posthookReceiver);
server.express.post(
	'/lifetime-payment',
	bodyParser.raw({type: 'application/json'}),
	paymentFromStripe,
);

server.express.post('/prep-for-test', bodyParser.json(), teardownAndSetupTest);

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
