import '@sapphire/plugin-logger/register';
import { container } from '@sapphire/framework';
import { connect } from 'mongoose';
import { bold } from 'chalk';
import { env, UserClient } from './lib';

export const client = new UserClient();

(async () => {
  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (e) {
    container.logger.error(e);
    client.destroy();
    process.exit(1);
  }

  connect(env.MONGO_URI)
    .then(() => {
      container.logger.info(`Connected to ${bold('MongoDB')} ✅`);
    }).catch((e) => {
      container.logger.error(e);
    });
  client.application?.commands.set([]); //* Remove All Commands
})().catch((e) => container.logger.error(e));
