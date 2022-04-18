import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { ColorResolvable, CommandInteraction, MessageEmbed } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';
import { env } from '../../lib';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Evaluate code with Suta.',
  enabled: true,
  name: 'eval',
  fullCategory: ['Utility', 'Administration'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (interaction.user.id !== env.DISCORD_OWNER) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.wrong} You do not have permission for this command.`)
            .setColor(colors.invisible as ColorResolvable),
        ],
      });
    }

    const code = interaction.options.get('code')?.value as string;
    try {
      // eslint-disable-next-line no-eval
      const result: string = eval(code);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle('Suta 💫 - Eval')
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`\`\`\`ts\n${result}\n\`\`\``),
        ],
        ephemeral: true,
      });
    } catch (err) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.wrong} An error occurred while evaluating your code.`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`\`\`\`ts\n${err}\`\`\``),
        ],
        ephemeral: true,
      });
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultPermission(true)
      .addStringOption((option) => option
        .setName('code')
        .setDescription('Code to evaluate.')
        .setRequired(true)));
  }
}
