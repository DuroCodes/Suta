import {
  ColorResolvable,
  CommandInteraction,
  Guild, GuildMember,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
  TextChannel,
  User,
} from 'discord.js';
import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { createTranscript } from 'discord-html-transcripts';
import GuildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';
import { TicketCategory } from '../../typings/category';
import { Ticket } from '../../typings/ticket';
import { TicketMenu } from '../../typings/menu';
import guildSchema from '../../typings/guild';

@ApplyOptions<CommandOptions>({
  name: 'ticket',
  description: 'Commands for tickets.',
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
    if (!guildData) guildData = await new GuildSchema({ guildId });

    async function menu() {
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

      if (!guildData?.ticketCategories || guildData?.ticketCategories?.length < 1) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You need to set up ticket categories first.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const {
        title, description, channel, color, footer, timestamp,
      } = guildData?.ticketMenu as TicketMenu;

      if (!channel) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} Ticket Menu Invalid.`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription('The ticket menu is not setup. Use `/settings menu` to set it up.'),
          ],
        });
      }

      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Sent Ticket Menu`)
            .setColor(colors.invisible as ColorResolvable),
        ],
      });

      const guild = interaction.guild as Guild;
      const ticketChannel = guild.channels.cache.get(channel) as TextChannel;

      if (!ticketChannel) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} Ticket Menu Invalid.`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription('The channel in the setup does not exist. Use `/settings menu` to set it up.'),
          ],
        });
      }

      const reasons = guildData?.ticketCategories?.map((category: TicketCategory) => {
        const {
          emoji: emojiName, description, name: label,
        } = category;
        return {
          emoji: emojiName as string, description: description as string, label: label as string, value: `ticket-${label}`,
        };
      });

      const dropdown = new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('ticket-menu')
            .setPlaceholder('Select a ticket category...')
            .setOptions(reasons),
        );

      const embed = new MessageEmbed()
        .setTitle(title as string)
        .setColor(color as ColorResolvable)
        .setDescription(`${description ? `${description}\n` : ''}${guildData.ticketCategories.map((category: TicketCategory) => `${category.emoji} - ${category.name}`).join('\n')}`);

      if (footer) embed.setFooter({ text: footer });
      if (timestamp) embed.setTimestamp();

      ticketChannel.send({
        embeds: [embed],
        components: [dropdown],
      }).catch(() => { });
    }

    async function add(user: User) {
      if (!roles.cache.has(guildData?.supportRole as string) && !permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You do not have permission to use this command.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const { tickets } = guildData as guildSchema;

      if (!tickets.find((t: Ticket) => t.channelId === interaction.channelId)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);
      if (ticket?.addedUsers?.includes(user.id)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This user is already been added to the ticket.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      ticket?.addedUsers?.push((user.id).toString());
      await guildData?.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.create(user, { VIEW_CHANNEL: true });

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Added User`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`${user} has been added to the ticket.`),
        ],
      });
    }

    async function remove(user: User) {
      if (!roles.cache.has(guildData?.supportRole as string) && !permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You do not have permission to use this command.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const { tickets } = guildData as any;

      if (!tickets.find((t: Ticket) => t.channelId === interaction.channelId)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);
      if (!ticket.addedUsers.includes(user.id)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This user is not added to this ticket.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      ticket?.addedUsers?.pull((user.id).toString());
      await guildData?.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.delete(user);

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Removed User`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`${user} has been removed from the ticket.`),
        ],
      });
    }

    async function claim() {
      const { tickets } = guildData as any;
      const ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);

      if (!ticket) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      if (ticket.claimed) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This ticket has already been claimed.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      ticket.claimed = true;
      await guildData?.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.edit(guildData?.supportRole as string, {
        VIEW_CHANNEL: false,
      });

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Ticket Claimed`)
            .setColor(colors.invisible as ColorResolvable),
        ],
      });
    }

    async function unclaim() {
      const { tickets } = guildData as any;
      const ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);

      if (!ticket) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      if (!ticket.claimed) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This ticket is not claimed.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      ticket.claimed = false;
      await guildData?.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.edit(guildData?.supportRole as string, {
        VIEW_CHANNEL: true,
      });

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Ticket Unclaimed`)
            .setColor(colors.invisible as ColorResolvable),
        ],
      });
    }

    async function rename(name: string) {
      const { tickets } = guildData as any;
      const ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);

      if (!ticket) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const channel = interaction.channel as TextChannel;

      if (guildData?.loggingEnabled && guildData.loggingChannel) {
        const guild = interaction.guild as Guild;
        const loggingChannel = guild.channels.cache.get(guildData.loggingChannel);
        if (loggingChannel instanceof TextChannel) {
          const embed = new MessageEmbed()
            .setTitle(`${emoji.ticket} Ticket Opened`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`${interaction.user} renamed \`#${channel.name}\` to \`#${name}\`.`)
            .setTimestamp();

          await loggingChannel.send({ embeds: [embed] }).catch(() => { });
        }
      }

      channel.setName(name, 'Suta 💫 | Ticket Renamed');

      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setTitle(`${emoji.correct} Ticket Renamed`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`The ticket has been renamed to \`${name}\``),
        ],
      });
    }

    async function close() {
      const { tickets } = guildData as any;
<<<<<<< HEAD
      const ticket: Ticket = tickets.find((t: Ticket) => t.channelId === interaction.channelId);
      if (!ticket) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This is not a ticket channel.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      (guildData?.tickets as any).pull(ticket);
      await guildData?.save();

      if (guildData?.transcriptsEnabled) {
        const ticketOwner = interaction.guild?.members.cache.get(ticket.creatorId as string);
        ticketOwner?.send({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.ticket} Ticket Closed`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`
${interaction.user} closed the ticket \`#${(interaction.channel as TextChannel).name}\`.
To view the transcript, click [here](http://api.suta.tk/transcripts/${(interaction.channel as TextChannel).id}).`),
          ],
        });
      }

      if (guildData?.loggingEnabled && guildData.loggingChannel) {
        const guild = interaction.guild as Guild;
        const loggingChannel = guild.channels.cache.get(guildData.loggingChannel);
        if (loggingChannel instanceof TextChannel) {
          const embed = new MessageEmbed()
            .setTitle(`${emoji.ticket} Ticket Closed`)
            .setColor(colors.invisible as ColorResolvable)
            .setDescription(`${interaction.user} closed the ticket \`#${(interaction.channel as TextChannel).name}\`. ${guildData.loggingEnabled ? `[Transcript](http://api.suta.tk/transcripts/${(interaction.channel as TextChannel).id})` : ''}`)
            .setTimestamp();

          await loggingChannel.send({ embeds: [embed] });
        }
      }

      const channel = interaction.channel as TextChannel;
      channel.delete('Suta 💫 | Ticket Closed').catch(() => {
        channel.send({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.ticket} Ticket Failed to Close`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`\
The ticket failed to close. Please insure I have permissions.
Join our support server for more information. (\`/support\`)`),
          ],
        });
      });
=======
      interaction.channel?.delete('Suta | Closed Ticket')
        .then(async () => {
          const channel = interaction.channel as TextChannel;
          const ticket = tickets.find((t: Ticket) => t.channelId === channel.id);
          (tickets as any).pull(ticket);

          if (guildData?.loggingEnabled && guildData.loggingChannel) {
            const guild = interaction.guild as Guild;
            const loggingChannel = guild.channels.cache.get(guildData.loggingChannel);
            if (loggingChannel instanceof TextChannel) {
              await loggingChannel.send({
                embeds: [
                  new MessageEmbed()
                    .setTitle(`${emoji.ticket} Ticket Closed`)
                    .setColor(colors.invisible as ColorResolvable)
                    .setDescription(`${interaction.user} closed the ticket \`#${(channel as TextChannel).name}\`.${guildData.transcriptsEnabled ? `\n[Transcript](http://api.suta.tk/transcripts/${(channel as TextChannel).id})` : ''}`)
                    .setTimestamp(),
                ],
              }).catch(() => { });
            }
          }

          await guildData?.save();

          if (guildData?.transcriptsEnabled) {
            const transcript = await createTranscript(channel as TextChannel, {
              returnType: 'string',
              minify: true,
            });

            guildData?.transcripts?.push({
              name: (channel as TextChannel).id, data: transcript as string,
            });

            interaction.user.send({
              embeds: [
                new MessageEmbed()
                  .setTitle(`${emoji.ticket} Ticket Closed`)
                  .setColor(colors.invisible as ColorResolvable)
                  .setDescription(`\
  ${interaction.user} closed the ticket \`#${(channel as TextChannel).name}\`.
  To view the transcript, click [here](http://api.suta.tk/transcripts/${(channel as TextChannel).id}).`)
                  .setTimestamp(),
              ],
            }).catch(() => { });
          }
        })
        .catch(() => {
          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.wrong} Failed to close ticket.`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`\
Please make sure I have permission to delete channels in this server.
Please join our support server for more information. \`/support\``),
            ],
            ephemeral: true,
          });
        });
>>>>>>> 21af5e19e6ce18c3eb81eba0f7f045266522c7b8
    }

    switch (interaction.options.getSubcommand(true)) {
      case 'menu': {
        menu();
        break;
      }
      case 'add': {
        const user = interaction.options.getUser('user');
        add(user as User);
        break;
      }
      case 'remove': {
        const user = interaction.options.getUser('user');
        remove(user as User);
        break;
      }
      case 'claim': {
        claim();
        break;
      }
      case 'unclaim': {
        unclaim();
        break;
      }
      case 'rename': {
        const name = interaction.options.getString('name') as string;
        rename(name);
        break;
      }
      case 'close': {
        close();
        break;
      }
      default: {
        break;
      }
    }
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'menu',
          description: 'Create a ticket creation menu.',
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'add',
          description: 'Add a user to the current ticket',
          options: [
            {
              name: 'user',
              description: 'The user to add to the ticket.',
              required: true,
              type: ApplicationCommandOptionTypes.USER,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'remove',
          description: 'Remove a user from the ticket.',
          options: [
            {
              name: 'user',
              description: 'The user to remove from the ticket.',
              required: true,
              type: ApplicationCommandOptionTypes.USER,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'claim',
          description: 'Claim the ticket.',
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'unclaim',
          description: 'Unclaim the ticket.',
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'rename',
          description: 'Rename the ticket.',
          options: [
            {
              type: ApplicationCommandOptionTypes.STRING,
              name: 'name',
              description: 'The new name for the ticket.',
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: 'close',
          description: 'Close the ticket.',
        },
      ],
    });
  }
}
