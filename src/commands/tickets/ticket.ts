import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Create a menu for ticket creation.',
  enabled: true,
  name: 'ticket',
  fullCategory: ['Tickets'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const row: MessageActionRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('ticket-create')
          .setLabel('Create Ticket')
          .setStyle('PRIMARY'),
      );

    interaction.reply({ content: 'Create a Ticket', components: [row] });
  }
}
