import {
  ColorResolvable, CommandInteraction, GuildMember, MessageEmbed,
} from 'discord.js';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import guildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Customize settings for the ticket system.',
  enabled: true,
  name: 'settings',
  fullCategory: ['Tickets'],
})

export class UserCommand extends Command {
  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder: any) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((sub: any) => sub
        .setName('support-role')
        .setDescription('Set the support role for the ticket system.')
        .addRoleOption((role: any) => role.setName('support-role').setDescription('The role to use for support tickets.').setRequired(true))));
  }

  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const { guildId } = interaction;
    const guildData = await guildSchema.findOne({ guildId });
    const { roles } = interaction.member as GuildMember;
    const { permissions } = interaction.member as GuildMember;
    if (!guildData) guildSchema.create({ guildId });

    if (!roles.cache.has(guildData?.ticketAdmin) && !permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.wrong} You do not have permission to use this command.`)
            .setColor(colors.invisible as ColorResolvable),
        ],
        ephemeral: true,
      });
    }
    interaction.reply({ content: 'PENIS!' });
  }
}
