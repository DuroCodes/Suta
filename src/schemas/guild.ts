import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
  guildId: String,
  adminRole: String,
  supportRole: String,
  ticketCategory: String,
  ticketCategories: [
    {
      name: String,
      description: String,
      emoji: String,
    },
  ],
});

export default model('Guild', guildSchema);
