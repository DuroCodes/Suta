import { Route } from '../../lib';
import { client } from '../../main';

export default new Route({
  prefix: '/api',
  async run(fastify, _options, done) {
    fastify.get(this.prefix, async (_req, rep) => {
      rep.header('Access-Control-Allow-Origin', '*');
      rep.type('application/json').code(200);
      return rep.send({
        servers: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      });
    });

    done();
  },
});
