import { TicketCategory } from './category';
import { Transcript } from './transcript';
import { TicketMenu } from './menu';
import { Ticket } from './ticket';

export interface GuildSchema {
  guildId?: string;
  adminRole?: string;
  supportRole?: string;
  ticketCategory?: string;
  maxTickets?: number;
  loggingEnabled?: boolean;
  loggingChannel?: string;
  transcriptsEnabled?: boolean;
  transcripts?: Transcript[];
  ticketMenu?: TicketMenu;
  ticketCategories?: TicketCategory[];
  tickets: Ticket[];
}

export default GuildSchema;
