import {
  ColorResolvable, CommandInteraction, GuildMember, MessageEmbed,
} from 'discord.js';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import guildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';

const enum SubCommandGroups {
  SupportRole = 'support-role',
  AdminRole = 'admin-role',
  Category = 'category',
}

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
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const { guildId } = interaction;
    const { roles } = interaction.member as GuildMember;
    const { permissions } = interaction.member as GuildMember;
    let guildData = await guildSchema.findOne({ guildId });
    if (!guildData) await guildSchema.create({ guildId });
    guildData = await guildSchema.findOne({ guildId });

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

    switch (interaction.options.getSubcommand(true) as SubCommandGroups) {
      case SubCommandGroups.SupportRole: {
        const supportRole = interaction.options.get(SubCommandGroups.SupportRole)?.value as string;
        await guildData.updateOne({ supportRole });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Support Role`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The support role has been set to \`${supportRole}\`.`),
          ],
          ephemeral: true,
        });
        break;
      }
      case SubCommandGroups.AdminRole: {
        const adminRole = interaction.options.get(SubCommandGroups.AdminRole)?.value as string;
        await guildData.updateOne({ adminRole });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Admin Role`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The admin role has been set to \`${adminRole}\`.`),
          ],
          ephemeral: true,
        });
        break;
      }
      case SubCommandGroups.Category: {
        const ticketCategory = interaction.options.get(SubCommandGroups.Category)?.value as string;
        await guildData.updateOne({ ticketCategory });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Ticket Category`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The ticket category has been set to \`${ticketCategory}\`.`),
          ],
          ephemeral: true,
        });
        break;
      }
      default:
        break;
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder: any) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((sub: any) => sub
        .setName(SubCommandGroups.SupportRole)
        .setDescription('Set the support role for the ticket system.')
        .addRoleOption((role: any) => role
          .setName(SubCommandGroups.SupportRole)
          .setDescription('The role to use for support tickets.')
          .setRequired(true)))
      .addSubcommand((sub: any) => sub
        .setName(SubCommandGroups.AdminRole)
        .setDescription('Set the admin role for the ticket system.')
        .addRoleOption((role: any) => role
          .setName(SubCommandGroups.AdminRole)
          .setDescription('The role to use for ticket admins.')
          .setRequired(true)))
      .addSubcommand((sub: any) => sub
        .setName(SubCommandGroups.Category)
        .setDescription('Set the category for the ticket system.')
        .addChannelOption((option: any) => option
          .setName(SubCommandGroups.Category)
          .setDescription('The category to use for tickets.')
          .setRequired(true)
          .addChannelTypes([4]))));
  }
}
