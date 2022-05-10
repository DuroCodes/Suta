import { container } from '@sapphire/framework';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import { bold } from 'chalk';
import { env } from '../lib';
import { client } from '../main';
import guildSchema from '../schemas/guild';
import { GuildSchema } from '../typings/guild';

interface TranscriptData {
  guildId: string;
  channelId: string;
}

export default async () => {
  const app = fastify({ logger: false });
  const port = env.PORT || 3000;

  app.register(fastifyStatic, {
    root: `${__dirname}/public`,
    prefix: '/public/',
  });

  app.get('/', async (_req, rep) => rep.sendFile('index.html'));

  app.get('/api/', async (_req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    rep.type('application/json').code(200);
    return {
      servers: client.guilds.cache.size,
      users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    };
  });

  app.get('/transcripts/:channelId', async (req, rep) => {
    rep.header('Access-Control-Allow-Origin', '*');
    const data: GuildSchema[] = await guildSchema.find();
    const { channelId } = req.params as TranscriptData;
    if (!channelId) return rep.code(400).send({ error: 'Missing query parameters. The channelId parameter is required. Example: /transcripts/<channelId>' });
    if (!data.length) return rep.code(404).send({ error: 'No data found' });

    const transcript = data.map(
      ({ transcripts }) => transcripts?.find(({ name }) => name === channelId),
    )[0];

    if (!transcript) return rep.code(404).send({ error: 'Channel not found' });

    rep.header('Content-Type', 'text/html');
    return transcript.data;
  });

  app.listen(port, '0.0.0.0', () => {
    container.logger.info(`Listening on port ${bold(port)} 🚀`);
  });
};
