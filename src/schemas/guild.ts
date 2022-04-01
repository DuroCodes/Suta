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
  },
  ticketCategories: [{
    name: String,
    description: String,
    emoji: String,
  }],
  tickets: [{
    creatorId: String,
    channelId: String,
    guildId: String,
    createdAt: String,
    claimed: Boolean,
    addedUsers: [{
      userId: String,
    }],
  }],
});

export default model('Guild', guildSchema);
