import { container } from '@sapphire/framework';
import { connect } from 'mongoose';
import { bold } from 'chalk';
import { env } from '../lib/env';

export default async () => {
  await connect(env.MONGO_URI);
  container.logger.info(`Connected to ${bold('MongoDB')} ✅`);
};
