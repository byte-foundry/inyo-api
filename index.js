const { GraphQLServer } = require('graphql-yoga')
const { ApolloEngine } = require('apollo-engine')
const bodyParser = require('body-parser')
const { prisma } = require('./generated/prisma-client')
const { resolvers } = require('./resolvers')

const server = new GraphQLServer({
  typeDefs: 'schema.graphql',
  resolvers,
  context: req => {
    return {
      ...req,
      db: prisma,
    }
  },
})

server.express.post('/send-reminder', bodyParser.json(), async (req, res) => {
  // look for X-Ph-Signature in ctx
  if (process.env.POSTHOOK_SIGNATURE !== req.get('X-Ph-Signature')) {
    throw new Error('The signature has not been verified.');
  }

  const reminder = await ctx.db.reminder({ id: req.body.data.reminderId });
  
  try {
    sendEmail(req.body.data);
    ctx.db.updateReminder({
      where: { id: reminder.id },
      status: 'SENT',
    });
    res.status(204).send();
  }
  catch (error) {
    ctx.db.updateReminder({
      where: { id: reminder.id },
      status: 'ERROR',
    });
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
