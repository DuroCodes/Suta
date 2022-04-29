import { container } from '@sapphire/framework';
import { bold } from 'chalk';
import fastify from 'fastify';
import { client } from '../main';
import { env } from '../lib';

interface Data {
  servers: number;
  users: number;
}

export default async function startServer() {
  const app = fastify();
  const port = env.PORT || 3000;

  app.get('/', async (_req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    rep.type('application/json').code(200);
    return {
      servers: client.guilds.cache.size,
      users: client.users.cache.size,
    } as Data;
  });

  app.listen(port, '0.0.0.0', () => {
    container.logger.info(`Listening on port ${bold(port)} 🚀`);
  });
}
