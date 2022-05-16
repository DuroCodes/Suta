import { container } from '@sapphire/framework';
import fastifyStatic from '@fastify/static';
import { promisify } from 'util';
import fastify from 'fastify';
import { bold } from 'chalk';
import glob from 'glob';
import { env, Route } from '../lib';

const globPromise = promisify(glob);

export default async () => {
  const app = fastify({ logger: false });
  const port = env.PORT || 3000;

  app.register(fastifyStatic, {
    root: `${__dirname}/public`,
    prefix: '/public/',
  });

  const files = await globPromise(`${__dirname}/routes/*.ts`);
  files.forEach(async (file) => {
    const imported: Route = (await import(file)).default;
    app.register(imported.run)
      .after(() => container.logger.debug(`Registered route ${bold(imported.prefix)}`));
  });

  app.listen(port, '0.0.0.0', (err) => {
    if (err) {
      container.logger.error(err);
      process.exit(1);
    }
  });

  app.ready(() => {
    container.logger.info(`Listening on port ${bold(port)}`);
  });
};
