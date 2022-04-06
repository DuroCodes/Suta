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
  MaxTickets = 'max-tickets',
  AdminRole = 'admin-role',
  Category = 'category',
  Menu = 'menu',
  Logs = 'logs',
}

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Customize settings for the ticket system.',
  enabled: true,
  name: 'settings',
  fullCategory: ['Tickets'],
  runIn: ['GUILD_ANY'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const { guildId } = interaction;
    const { roles } = interaction.member as GuildMember;
    const { permissions } = interaction.member as GuildMember;
    let guildData = await GuildSchema.findOne({ guildId });
    if (!guildData) guildData = await new GuildSchema({ guildId });

    if (!roles.cache.has(guildData?.adminRole) && !permissions.has('ADMINISTRATOR')) {
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
      case Subcommand.Menu: {
        const title = interaction.options.get('title')?.value as string;
        const description = interaction.options.get('description')?.value as string;
        const channel = interaction.options.get('channel')?.value as string;
        const color = interaction.options.get('color')?.value as string || guildData.ticketMenu.color || colors.invisible;
        const footer = interaction.options.get('footer')?.value as string;
        const timestamp = interaction.options.get('timestamp')?.value as boolean || false;
        const showDescription = interaction.options.get('show-description')?.value as boolean || true;

        if (!color.match(/^#?[0-9a-f]{6}$/i)) {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.wrong} Invalid Color`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription('The color you provided is not a valid hex color.'),
            ],
          });
        }

        await guildData.updateOne({
          ticketMenu: {
            title,
            description,
            channel,
            footer,
            timestamp,
            showDescription,
            color,
          },
        });
        await guildData.save();

        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.settings} Ticket Menu`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`\
The ticket menu has been updated.
**Title:** \`${title}\`
**Description:** \`${description}\`${footer ? `\n**Footer:** \`${footer}\`` : ''}${timestamp ? `\n**Timestamp:** \`${timestamp}\`` : ''}${!showDescription ? `\n**Show Description:** \`${showDescription}\`` : ''}
**Color:** \`${color}\`
**Channel:** \`${channel}\``),
          ],
        });
        break;
      }
      case Subcommand.MaxTickets: {
        const maxTickets = interaction.options.get(Subcommand.MaxTickets)?.value as number;
        await guildData.updateOne({ maxTickets });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Max Tickets`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`The max tickets has been set to \`${maxTickets}\`.`),
          ],
        });
        break;
      }
      case Subcommand.Logs: {
        const loggingChannel = interaction.options.get('channel')?.value as string;
        const loggingEnabled = interaction.options.get('enabled')?.value as boolean;
        await guildData.updateOne({
          loggingChannel,
          loggingEnabled,
        });
        await guildData.save();
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.settings} Logging`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`\
The logging channel has been set to \`${loggingChannel}\`.
**Enabled:** \`${loggingEnabled}\``),
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
      .addSubcommand((logs) => logs
        .setName('logs')
        .setDescription('Set options for the logging system.')
        .addBooleanOption((bol) => bol
          .setName('enabled')
          .setDescription('Enable logging.')
          .setRequired(true))
        .addChannelOption((cha) => cha
          .setName('channel')
          .setDescription('The channel to log to.')
          .setRequired(true)
          .addChannelTypes([0])))
      .addSubcommand((sub) => sub
        .setName(Subcommand.SupportRole)
        .setDescription('Set the support role for the ticket system.')
        .addRoleOption((role) => role
          .setName(Subcommand.SupportRole)
          .setDescription('The role to use for support tickets.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName(Subcommand.MaxTickets)
        .setDescription('Set the support role for the ticket system.')
        .addIntegerOption((int) => int
          .setName(Subcommand.MaxTickets)
          .setDescription('The maximum number of tickets per person.')
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
          .addChannelTypes([4])))
      .addSubcommand((sub) => sub
        .setName(Subcommand.Menu)
        .setDescription('Change the appearance of the ticket menu.')
        .addStringOption((option) => option
          .setName('title')
          .setDescription('The title of the ticket menu.')
          .setRequired(true))
        .addChannelOption((option) => option
          .setName('channel')
          .setDescription('The channel to send the ticket menu to.')
          .setRequired(true)
          .addChannelTypes([0]))
        .addStringOption((option) => option
          .setName('description')
          .setDescription('The description of the ticket menu.'))
        .addStringOption((option) => option
          .setName('footer')
          .setDescription('The footer of the ticket menu.'))
        .addStringOption((option) => option
          .setName('color')
          .setDescription('The color of the ticket menu.'))
        .addBooleanOption((option) => option
          .setName('show-description')
          .setDescription('Whether or not to show the description of the ticket menu.'))
        .addBooleanOption((option) => option
          .setName('timestamp')
          .setDescription('Whether or not to show the timestamp of the ticket menu.'))));
  }
}
