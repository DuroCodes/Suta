import {
  ColorResolvable, CommandInteraction, GuildMember, MessageEmbed,
} from 'discord.js';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import GuildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';

const enum Subcommand {
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
    let guildData = await GuildSchema.findOne({ guildId });
    if (!guildData) guildData = await new GuildSchema({ guildId, ticketCategories: [] });

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

    switch (interaction.options.getSubcommand(true) as Subcommand) {
      case Subcommand.SupportRole: {
        const supportRole = interaction.options.get(Subcommand.SupportRole)?.value as string;
        await guildData.updateOne({ supportRole });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Support Role`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The support role has been set to \`${supportRole}\`.`),
          ],
        });
        break;
      }
      case Subcommand.AdminRole: {
        const adminRole = interaction.options.get(Subcommand.AdminRole)?.value as string;
        await guildData.updateOne({ adminRole });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Admin Role`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The admin role has been set to \`${adminRole}\`.`),
          ],
        });
        break;
      }
      case Subcommand.Category: {
        const ticketCategory = interaction.options.get(Subcommand.Category)?.value as string;
        await guildData.updateOne({ ticketCategory });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Ticket Category`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The ticket category has been set to \`${ticketCategory}\`.`),
          ],
        });
        break;
      }
      default:
        break;
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((sub) => sub
        .setName(Subcommand.SupportRole)
        .setDescription('Set the support role for the ticket system.')
        .addRoleOption((role) => role
          .setName(Subcommand.SupportRole)
          .setDescription('The role to use for support tickets.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName(Subcommand.AdminRole)
        .setDescription('Set the admin role for the ticket system.')
        .addRoleOption((role) => role
          .setName(Subcommand.AdminRole)
          .setDescription('The role to use for ticket admins.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName(Subcommand.Category)
        .setDescription('Set the category for the ticket system.')
        .addChannelOption((option) => option
          .setName(Subcommand.Category)
          .setDescription('The category to use for tickets.')
          .setRequired(true)
          .addChannelTypes([4]))));
  }
}
