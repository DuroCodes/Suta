export interface Ticket {
  creatorId?: string;
  channelId?: string;
  guildId?: string;
  createdAt?: string;
  claimed?: boolean;
  addedUsers?: string[];
}
