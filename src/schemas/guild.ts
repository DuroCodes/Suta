import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
  guildId: String,
  adminRole: String,
  supportRole: String,
  ticketCategory: String,
  ticketMenu: {
    title: String,
    description: String,
    channel: String,
    color: String,
    footer: String,
    timestamp: Boolean,
  },
  ticketCategories: [{
    name: String,
    description: String,
    emoji: String,
  }],
});

export default model('Guild', guildSchema);
