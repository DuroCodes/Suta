import {
  ColorResolvable, CommandInteraction, GuildMember, MessageEmbed,
} from 'discord.js';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { ApplicationCommandOptionTypes, ChannelTypes } from 'discord.js/typings/enums';
import { ApplyOptions } from '@sapphire/decorators';
import GuildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';

const enum Subcommand {
  SupportRole = 'support-role',
  Transcripts = 'transcripts',
  MaxTickets = 'max-tickets',
  AdminRole = 'admin-role',
  Category = 'category',
  Menu = 'menu',
  Logs = 'logs',
}

@ApplyOptions<CommandOptions>({
  name: 'settings',
  description: 'Customize settings for the ticket system.',
  fullCategory: ['Tickets'],
  runIn: ['GUILD_ANY'],
  enabled: true,
  chatInputCommand: { register: true },
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const { guildId } = interaction;
    const { roles } = interaction.member as GuildMember;
    const { permissions } = interaction.member as GuildMember;
    let guildData = await GuildSchema.findOne({ guildId });
    if (!guildData) guildData = new GuildSchema({ guildId });

    if (!roles.cache.has(guildData?.adminRole as string) && !permissions.has('ADMINISTRATOR')) {
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
        const color = interaction.options.get('color')?.value as string || guildData.ticketMenu?.color || colors.invisible;
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
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.settings} Logging`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`\
The logging channel has been updated.
**Channel:** \`${loggingChannel || guildData?.loggingChannel || 'No Channel'}\`
**Enabled:** \`${loggingEnabled}\``),
          ],
        });
        await guildData.updateOne({
          loggingChannel: loggingChannel || guildData?.loggingChannel,
          loggingEnabled,
        });
        await guildData.save();
        break;
      }
      case Subcommand.Transcripts: {
        const transcriptsEnabled = interaction.options.get('enabled')?.value as boolean;
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.settings} Transcripts`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`\
The transcripts have been updated.
**Enabled:** \`${transcriptsEnabled}\``),
          ],
        });
        guildData.transcriptsEnabled = transcriptsEnabled;
        await guildData.save();
        break;
      }
      default:
        break;
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.Transcripts,
          description: 'Set options for transcripts.',
          options: [
            {
              name: 'enabled',
              description: 'Enable transcripts.',
              required: true,
              type: ApplicationCommandOptionTypes.BOOLEAN,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.Logs,
          description: 'Set options for the logging system.',
          options: [
            {
              name: 'enabled',
              description: 'Enable logging.',
              required: true,
              type: ApplicationCommandOptionTypes.BOOLEAN,
            },
            {
              channel_types: [
                ChannelTypes.GUILD_TEXT,
              ],
              name: 'channel',
              description: 'The channel to log to.',
              required: false,
              type: ApplicationCommandOptionTypes.CHANNEL,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.SupportRole,
          description: 'Set the support role for the ticket system.',
          options: [
            {
              name: Subcommand.SupportRole,
              description: 'The role to use for support tickets.',
              required: true,
              type: ApplicationCommandOptionTypes.ROLE,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.MaxTickets,
          description: 'Set the support role for the ticket system.',
          options: [
            {
              type: ApplicationCommandOptionTypes.INTEGER,
              name: Subcommand.MaxTickets,
              description: 'The maximum number of tickets per person.',
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.AdminRole,
          description: 'Set the admin role for the ticket system.',
          options: [
            {
              name: Subcommand.AdminRole,
              description: 'The role to use for ticket admins.',
              required: true,
              type: ApplicationCommandOptionTypes.ROLE,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.Category,
          description: 'Set the category for the ticket system.',
          options: [
            {
              channel_types: [
                ChannelTypes.GUILD_CATEGORY,
              ],
              name: Subcommand.Category,
              description: 'The category to use for tickets.',
              required: true,
              type: ApplicationCommandOptionTypes.CHANNEL,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: Subcommand.Menu,
          description: 'Change the appearance of the ticket menu.',
          options: [
            {
              type: ApplicationCommandOptionTypes.STRING,
              name: 'title',
              description: 'The title of the ticket menu.',
              required: true,
            },
            {
              channel_types: [
                ChannelTypes.GUILD_TEXT,
              ],
              name: 'channel',
              description: 'The channel to send the ticket menu to.',
              required: true,
              type: ApplicationCommandOptionTypes.CHANNEL,
            },
            {
              type: ApplicationCommandOptionTypes.STRING,
              name: 'description',
              description: 'The description of the ticket menu.',
              required: false,
            },
            {
              type: ApplicationCommandOptionTypes.STRING,
              name: 'footer',
              description: 'The footer of the ticket menu.',
              required: false,
            },
            {
              type: ApplicationCommandOptionTypes.STRING,
              name: 'color',
              description: 'The color of the ticket menu.',
              required: false,
            },
            {
              name: 'show-description',
              description: 'Whether or not to show the description of the ticket menu.',
              required: false,
              type: ApplicationCommandOptionTypes.BOOLEAN,
            },
            {
              name: 'timestamp',
              description: 'Whether or not to show the timestamp of the ticket menu.',
              required: false,
              type: ApplicationCommandOptionTypes.BOOLEAN,
            },
          ],
        },
      ],
    });
  }
}
