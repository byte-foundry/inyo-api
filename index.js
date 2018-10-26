const { GraphQLServer } = require('graphql-yoga')
const { ApolloEngine } = require('apollo-engine')
const bodyParser = require('body-parser')
const { prisma } = require('./generated/prisma-client')
const { resolvers } = require('./resolvers')

const {sendEmail} = require('./emails/SendEmail.js');

const PORT = process.env.PORT;

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
	console.log(req.get('X-Ph.Signature'));
  if (process.env.POSTHOOK_SIGNATURE !== req.get('X-Ph-Signature')) {
    throw new Error('The signature has not been verified.');
  }

  const reminder = await prisma.reminder({ id: req.body.data.reminderId });

  try {
    await sendEmail(req.body.data);
    await prisma.updateReminder({
      where: { id: reminder.id },
      status: 'SENT',
    });
	  console.log(`${new Date().toISOString()}: Reminder with id ${reminder.id} sent`);
    res.status(204).send();
  }
  catch (error) {
    await prisma.updateReminder({
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
    { port: PORT, httpServer, graphqlPaths: ['/'] },
    () =>
      console.log(
        `Server with Apollo Engine is running on http://localhost:${PORT}`,
      ),
  )
} else {
  server.start({ port: PORT, tracing: 'enabled' }, () => console.log(`Server with Apollo Engine is running on http://localhost:${PORT}`));
}
