import { container } from '@sapphire/framework';
import { bold } from 'chalk';
import fastify from 'fastify';
import { client } from '../main';
import { env } from '../lib';
import guildSchema from '../schemas/guild';

interface Data {
  servers: number;
  users: number;
}

interface TranscriptData {
  guildId: string;
  channelId: string;
}

export default async () => {
  const app = fastify();
  const port = env.PORT || 3000;

  app.get('/', async (_req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    rep.type('application/json').code(200);
    return {
      servers: client.guilds.cache.size,
      users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    } as Data;
  });

  app.get('/transcripts', async (req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    const data = await guildSchema.find();
    const { guildId, channelId } = req.query as TranscriptData;
    if (!guildId || !channelId) return rep.code(400).send('Missing query params. guildId and channelId are required.');

    const guildData = data.find(({ guildId: id }) => id === guildId);
    if (!guildData) return rep.code(404);

    const { transcripts } = guildData;
    if (!transcripts) return rep.code(404);

    const transcript = transcripts.find(({ name }) => name === channelId);
    rep.header('Content-Type', 'text/html');
    return transcript?.data;
  });

  app.listen(port, '0.0.0.0', () => {
    container.logger.info(`Listening on port ${bold(port)} 🚀`);
  });
};
