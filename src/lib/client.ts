import { LogLevel, SapphireClient } from '@sapphire/framework';
import { Intents } from 'discord.js';
import { env } from './env';

export class UserClient extends SapphireClient {
  public constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
      loadDefaultErrorListeners: true,
      logger: {
        level: LogLevel.Debug,
      },
    });
  }

  public async start(): Promise<void> {
    await this.login(env.DISCORD_TOKEN);
  }
}
