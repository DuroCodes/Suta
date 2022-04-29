import '@sapphire/plugin-logger/register';
import { container } from '@sapphire/framework';
import { connect } from 'mongoose';
import { bold } from 'chalk';
import { env, UserClient } from './lib';
import startServer from './api/server';

export const client = new UserClient();

(async () => {
  try {
    await client.start();

    connect(env.MONGO_URI)
      .then(() => container.logger.info(`Connected to ${bold('MongoDB')} ✅`));

    await startServer();
  } catch (e) {
    container.logger.error(e);
    client.destroy();
    process.exit(1);
  }
})().catch((e) => container.logger.error(e));
