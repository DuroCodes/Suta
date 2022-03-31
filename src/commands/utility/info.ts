import Discord, { ColorResolvable, CommandInteraction, MessageEmbed } from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import typescript from 'typescript';
import si from 'systeminformation';
import os from 'os';
import ms from 'ms';
import colors from '../../util/colors.json';
import formatBytes from '../../lib/formatBytes';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Get information about the bot.',
  enabled: true,
  name: 'info',
  fullCategory: ['Information', 'Utility'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const memory = process.memoryUsage();
    const cpu = await si.cpu();

    const embed = new MessageEmbed()
      .setTitle('Suta 💫 - Developer Info')
      .setColor(colors.invisible as ColorResolvable)
      .addFields(
        {
          name: '**Versions 📦**',
          value: `\
**Node.js:** ${process.version}
**TypeScript:** v${typescript.version}
**Discord.js:** v${Discord.version}`,
          inline: true,
        },
        {
          name: '**Memory Usage 📊**',
          value: `\
**RSS:** ${formatBytes(memory.rss)}
**Total:** ${formatBytes(memory.heapTotal)}
**Used:** ${formatBytes(memory.heapUsed)}`,
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: '**CPU Info 💻**',
          value: `\
**Model:** ${cpu.manufacturer} ${cpu.brand}
**Cores:** ${cpu.cores}
**Speed:** ${cpu.speed} MHz`,
          inline: true,
        },
        {
          name: '**System Info 📋**',
          value: `\
**Name**: ${os.type()}
**Platform:** ${os.platform()}
**Architecture:** ${os.arch()}
**Uptime:** ${ms(os.uptime() * 1000, { long: true })}`,
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
      );

    void interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
