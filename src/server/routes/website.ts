import { Route } from '../../lib';

export default new Route({
  prefix: '/',
  async run(fastify, _options, done) {
    fastify.get(this.prefix, async (_req, rep) => rep.sendFile('index.html'));
    done();
  },
});
