import {
  ColorResolvable,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import colors from '../../util/colors.json';

@ApplyOptions<CommandOptions>({
  name: 'support',
  description: 'Get support for Suta.',
  fullCategory: ['Information', 'Utility'],
  runIn: ['GUILD_ANY'],
  enabled: true,
  chatInputCommand: { register: true },
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle('Suta 💫 - Support')
      .setColor(colors.invisible as ColorResolvable)
      .setDescription('Click the button below to join the support server.');

    const button = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setURL('https://discord.gg/8pQ4zRxevE')
          .setLabel('Support Server')
          .setStyle('LINK'),
      );

    interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
  }
}
