import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Interaction } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  name: 'interactionCreate',
})

export class UserListener extends Listener {
  public run(interaction: Interaction): void {
    if (interaction.isCommand() || !interaction.guildId) return;
    if (interaction.isButton()) {
      if (interaction.customId === 'ticket-create') {
        interaction.reply('You clicked the create ticket button!');
      }
    }
  }
}
