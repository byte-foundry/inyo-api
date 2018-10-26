const { GraphQLServer } = require('graphql-yoga')
const { ApolloEngine } = require('apollo-engine')
const bodyParser = require('body-parser')
const { prisma } = require('./generated/prisma-client')
const { resolvers } = require('./resolvers')

const {sendEmail} = require('./emails/SendEmail.js');

const server = new GraphQLServer({
  typeDefs: 'schema.graphql',
  resolvers,
  context: req => {
    const { request } = req;
	const xForwardedFor = (request.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
	const ip = xForwardedFor || request.connection.remoteAddress;

    return {
      ...req,
      db: prisma,
	  ip,
    }
  },
})

server.express.get('/send-reminder', (req, res) => {
	return res.status(200).send('bonjour');
})

server.express.post('/send-reminder', bodyParser.json(), async (req, res) => {
  // look for X-Ph-Signature in ctx
  if (process.env.POSTHOOK_SIGNATURE !== req.get('X-Ph-Signature')) {
    throw new Error('The signature has not been verified.');
  }

  const reminder = await ctx.db.reminder({ id: req.body.data.reminderId });

  try {
    await sendEmail(req.body.data);
    await ctx.db.updateReminder({
      where: { id: reminder.id },
      status: 'SENT',
    });
	  console.log(`${new Date().toISOString()}: Reminder with id ${reminder.id} sent`);
    res.status(204).send();
  }
  catch (error) {
    await ctx.db.updateReminder({
      where: { id: reminder.id },
      status: 'ERROR',
    });
	  console.log(`${new Date().toISOString()}: Reminder with id ${reminder.id} not sent with error ${error}`);
    res.status(500).send({
      message: 'Something wrong happened!',
    });
  }
})

if (process.env.APOLLO_ENGINE_KEY) {
  const engine = new ApolloEngine({
    apiKey: process.env.APOLLO_ENGINE_KEY,
  })

  const httpServer = server.createHttpServer({
    tracing: true,
    cacheControl: true,
  })

  engine.listen(
    { port: 4000, httpServer, graphqlPaths: ['/'] },
    () =>
      console.log(
        `Server with Apollo Engine is running on http://localhost:4000`,
      ),
  )
} else {
  server.start({ tracing: 'enabled' }, () => console.log('Server is running on http://localhost:4000'))
}
