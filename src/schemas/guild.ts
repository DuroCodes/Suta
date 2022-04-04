import { Schema, model } from 'mongoose';

const guildSchema = new Schema({
  guildId: String,
  adminRole: String,
  supportRole: String,
  ticketCategory: String,
  maxTickets: Number,
  ticketMenu: {
    title: String,
    description: String,
    channel: String,
    color: String,
    footer: String,
    timestamp: Boolean,
    showDescription: Boolean,
  },
  ticketCategories: [{
    name: String,
    description: String,
    emoji: String,
    embedDesc: String,
    ticketText: String,
  }],
  tickets: [{
    creatorId: String,
    channelId: String,
    guildId: String,
    createdAt: String,
    claimed: Boolean,
    addedUsers: [String],
  }],
});

export default model('Guild', guildSchema);
