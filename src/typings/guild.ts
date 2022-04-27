import { TicketMenu } from './menu';
import { TicketCategory } from './category';
import { Ticket } from './ticket';

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

export default GuildSchema;
