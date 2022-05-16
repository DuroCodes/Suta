import {
  blue, cyan, magenta, red, yellow,
} from 'chalk';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import { Intents } from 'discord.js';
import { env } from './env';
import connectDB from '../server/database';
import startServer from '../server/api';

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
        format: {
          debug: {
            timestamp: null,
            infix: magenta.bold('\b\b[DEBUG] '),
          },
          info: {
            timestamp: null,
            infix: cyan.bold('\b\b[INFO] '),
          },
          warn: {
            timestamp: null,
            infix: yellow.bold('\b\b[WARN] '),
          },
          error: {
            timestamp: null,
            infix: red.bold('\b\b[ERROR] '),
          },
          fatal: {
            timestamp: null,
            infix: red.bold('\b\b[FATAL] '),
          },
          trace: {
            timestamp: null,
            infix: blue.bold(`${'\b'.repeat(7)}[TRACE] `),
          },
        },
      },
    });
  }

  public async start(): Promise<void> {
    await this.login(env.DISCORD_TOKEN);
    await startServer();
    await connectDB();
  }
}
