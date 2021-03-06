import { Schema, model } from 'mongoose';
import GuildSchema from '../typings/guild';

const guildSchema = new Schema<GuildSchema>({
  guildId: String,
  adminRole: String,
  supportRole: String,
  ticketCategory: String,
  maxTickets: Number,
  loggingEnabled: Boolean,
  loggingChannel: String,
  transcriptsEnabled: Boolean,
  transcripts: [{
    name: String,
    data: String,
  }],
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
    ticketText: String,
    embedDesc: String,
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

export default model<GuildSchema>('model', guildSchema);
