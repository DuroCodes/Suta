import '@sapphire/plugin-logger/register';
import { container } from '@sapphire/framework';
import { UserClient } from './lib';

export const client = new UserClient();

(async () => {
  try {
    await client.start();
  } catch (e) {
    container.logger.error(e);
    client.destroy();
    process.exit(1);
  }
})().catch(container.logger.error);
