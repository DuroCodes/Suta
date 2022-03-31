import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
  guildId: String,
  ticketAdmin: String,
  supportRole: String,
  ticketCategories: [
    {
      name: String,
      description: String,
      emoji: String,
    },
  ],
});

export default model('Guild', guildSchema);
