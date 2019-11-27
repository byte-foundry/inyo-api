const express = require('express');
const {ApolloServer, makeExecutableSchema} = require('apollo-server-express');
const {applyMiddleware} = require('graphql-middleware');
const bodyParser = require('body-parser');
const {DeprecatedDirective} = require('graphql-directive-deprecated');
const {importSchema} = require('graphql-import');
const {verify} = require('jsonwebtoken');
const moment = require('moment');

const {prisma} = require('./generated/prisma-client');
const {createLoaders} = require('./loaders');
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

const typeDefs = importSchema('schema.graphql');
const schema = makeExecutableSchema({typeDefs, resolvers});
const schemaWithMiddlewares = applyMiddleware(schema, permissions);

const server = new ApolloServer({
	schema: schemaWithMiddlewares,
	schemaDirectives: {
		deprecated: DeprecatedDirective,
	},
	context: async ({req: request}) => {
		const xForwardedFor = (request.headers['x-forwarded-for'] || '').replace(
			/:\d+$/,
			'',
		);
		const ip = xForwardedFor || request.connection.remoteAddress;
		const userId = getUserId(request);
		const token = getToken(request);

		let user = null;

		let isAuthenticated = false;

		let isPayingOrInTrial = false;

		if (userId) {
			user = await prisma.user({id: userId});
			isAuthenticated = !!user;

			if (
				user
				&& (user.lifetimePayment
					|| moment().diff(moment(user.createdAt), 'days') < 21)
			) {
				isPayingOrInTrial = true;
			}
		}

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
			request,
			db: prisma,
			loaders: createLoaders(),
			userId,
			isAuthenticated,
			isPayingOrInTrial,
			language,
			timeZone,
			token,
			ip,
		};
	},
	playground: true,
	debug: process.env.NODE_ENV === 'development',
	introspection: true,
	tracing: true,
	cacheControl: true,
	engine: {
		apiKey: process.env.APOLLO_ENGINE_KEY,
	},
});

const app = express();

server.applyMiddleware({
	app,
	path: '/',
});

app.post('/schedule-daily-mails', scheduleDailyMails);
app.post('/update-intercom', updateIntercom);

app.post('/posthook-receiver', bodyParser.json(), posthookReceiver);
app.post(
	'/lifetime-payment',
	bodyParser.raw({type: 'application/json'}),
	paymentFromStripe,
);

app.post('/prep-for-test', bodyParser.json(), teardownAndSetupTest);

app.listen({port: PORT}, () => console.log(`Server is running on http://localhost:${PORT}`));

subscribeToUpdateIntercom(prisma);
notifyViewedProject(prisma);
