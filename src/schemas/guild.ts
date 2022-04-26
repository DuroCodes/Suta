import { Document, Schema, model } from 'mongoose';
import { TicketCategory } from '../typings/category';
import { Ticket } from '../typings/ticket';
import { TicketMenu } from '../typings/menu';

interface GuildSchema {
  guildId?: string;
  adminRole?: string;
  supportRole?: string;
  ticketCategory?: string;
  maxTickets?: number;
  loggingEnabled?: boolean;
  loggingChannel?: string;
  ticketMenu?: TicketMenu;
  ticketCategories?: TicketCategory[];
  tickets: Ticket[];
}

interface GuildModel extends GuildSchema, Document { }

const guildSchema = new Schema({
  guildId: String,
  adminRole: String,
  supportRole: String,
  ticketCategory: String,
  maxTickets: Number,
  loggingEnabled: Boolean,
  loggingChannel: String,
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

export default model<GuildModel>('model', guildSchema);
