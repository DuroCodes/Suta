import { container } from '@sapphire/framework';
import { bold } from 'chalk';
import fastify from 'fastify';
import { client } from '../main';
import { env } from '../lib';
import guildSchema from '../schemas/guild';
import { GuildSchema } from '../typings/guild';

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

  app.get('/transcripts/:channelId', async (req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    const data: GuildSchema[] = await guildSchema.find();
    const { channelId } = req.params as TranscriptData;
    if (!channelId) return rep.code(400).send({ error: 'Missing query parameters. The channelId parameter is required. Example: /transcripts/<channelId>' });
    if (!data.length) return rep.code(404).send({ error: 'No data found' });

    const transcriptData = data.filter(
      ({ transcripts }) => transcripts?.find(({ name }) => name === channelId),
    );

    const transcript = transcriptData.map(
      ({ transcripts }) => transcripts?.find(({ name }) => name === channelId),
    )[0];

    if (!transcriptData) return rep.code(404).send({ error: 'Channel not found' });
    if (!transcript) return rep.code(404).send({ error: 'Channel not found' });

    rep.header('Content-Type', 'text/html');
    return transcript.data;
  });

  app.listen(port, '0.0.0.0', () => {
    container.logger.info(`Listening on port ${bold(port)} 🚀`);
  });
};
