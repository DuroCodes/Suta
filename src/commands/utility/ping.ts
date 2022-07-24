import {
  ColorResolvable,
  CommandInteraction,
  Message,
  MessageEmbed,
} from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import colors from '../../util/colors.json';

@ApplyOptions<CommandOptions>({
  name: 'ping',
  description: 'Get the bot\'s latency.',
  fullCategory: ['Information', 'Utility'],
  runIn: ['GUILD_ANY'],
  enabled: true,
  //chatInputCommand: { register: true },
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const firstEmbed = new MessageEmbed()
      .setTitle('Suta 💫 - Ping')
      .setTimestamp()
      .setColor(colors.invisible as ColorResolvable)
      .setDescription('Thinking...');

    const reply = await interaction.reply({
      embeds: [firstEmbed], fetchReply: true, ephemeral: true,
    }) as Message;

    const finalEmbed = new MessageEmbed()
      .setTitle('Suta 💫 - Ping')
      .setTimestamp()
      .setColor(colors.invisible as ColorResolvable)
      .setDescription(`\
**🏓 API Latency:** \`${this.container.client.ws.ping}ms\`
**🤖 Bot Latency:** \`${reply.createdTimestamp - interaction.createdTimestamp}ms\``);

    interaction.editReply({ embeds: [finalEmbed] });
  }
}
