import { Route } from '../../lib';
import GuildSchema from '../../typings/guild';
import guildSchema from '../../schemas/guild';
import { Transcript } from '../../typings/transcript';

export interface TranscriptData {
  channelId: string;
}

export default new Route({
  prefix: '/transcripts/:channelId',
  async run(fastify, _options, done) {
    fastify.get(this.prefix, async (req, rep) => {
      rep.header('Access-Control-Allow-Origin', '*');
      const data: GuildSchema[] = await guildSchema.find();
      const { channelId } = req.params as TranscriptData;

      if (!channelId) return rep.code(400).send({ error: 'Missing query parameters. The channelId parameter is required. Example: /transcripts/<channelId>' });
      if (!data.length) return rep.code(404).send({ error: 'No data found' });

      const transcript = (data
        .map(({ transcripts }) => transcripts)
        .flat() as Transcript[])
        .find(({ name: id }) => id === channelId);

      if (!transcript) return rep.code(404).send({ error: 'Channel not found' });

      rep.header('Content-Type', 'text/html');
      return transcript.data;
    });

    done();
  },
});
