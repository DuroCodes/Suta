import { ColorResolvable, CommandInteraction, MessageEmbed } from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import colors from '../colors.json';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Get the bot\'s latency.',
  enabled: true,
  name: 'ping',
  fullCategory: ['Information', 'Utility'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const embed: MessageEmbed = new MessageEmbed()
      .setTitle('Suta 💫 - Ping')
      .setTimestamp()
      .setColor(colors.invisible as ColorResolvable)
      .setDescription(`\
**🏓 API Latency:** \`${this.container.client.ws.ping}ms\`
**🤖 Latency:** \`${Date.now() - interaction.createdTimestamp}ms\``);

    void interaction.reply({ embeds: [embed] });
  }
}
