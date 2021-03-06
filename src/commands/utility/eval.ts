import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { ColorResolvable, CommandInteraction, MessageEmbed } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';
import { env } from '../../lib';

@ApplyOptions<CommandOptions>({
  name: 'eval',
  description: 'Evaluate code with Suta.',
  fullCategory: ['Utility', 'Administration'],
  enabled: true,
  //chatInputCommand: { register: true },
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
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionTypes.STRING,
          name: 'code',
          description: 'Code to evaluate.',
          required: true,
        },
      ],
    });
  }
}
