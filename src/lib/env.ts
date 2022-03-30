import { load } from 'ts-dotenv';

export const env = load({
  DISCORD_OWNER: String,
  DISCORD_TOKEN: String,
  MONGO_URI: String,
});
