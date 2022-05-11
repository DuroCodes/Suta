import {
  CategoryChannel,
  ColorResolvable,
  Interaction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  TextChannel,
  Guild,
  ApplicationCommandOptionChoice,
} from 'discord.js';
import { Listener, type ListenerOptions } from '@sapphire/framework';
import { createTranscript } from 'discord-html-transcripts';
import { ApplyOptions } from '@sapphire/decorators';
import { TicketCategory } from '../typings/category';
import { Ticket } from '../typings/ticket';
import GuildSchema from '../schemas/guild';
import colors from '../util/colors.json';
import emoji from '../util/emoji.json';

@ApplyOptions<ListenerOptions>({
  name: 'interactionCreate',
})

export class UserListener extends Listener {
  public async run(interaction: Interaction): Promise<void> {
    if (interaction.isCommand() && !interaction.guildId) return;

    if (interaction.isAutocomplete()) {
      if (interaction.commandName === 'category') {
        const guildData = await GuildSchema.findOne({ guildId: interaction.guildId });
        if (!guildData || !guildData.ticketCategories) return interaction.respond([{ name: 'No Categories Found', value: '' }]);

        const { ticketCategories } = guildData;

        const choices = ticketCategories.map(
          ({ name }) => ({ value: name, name }),
        ) as ApplicationCommandOptionChoice[];

        return interaction.respond(choices);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'ticket-close') {
        const { guildId, user, channel } = interaction;
        let guildData = await GuildSchema.findOne({ guildId });
        if (!guildData) guildData = new GuildSchema({ guildId });

        const { tickets } = guildData;
        const ticket = tickets.find((
          t: Ticket,
        ) => t.creatorId === user.id && t.channelId === interaction.channelId);

        if (!ticket) {
          return interaction.reply({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.wrong} This channel is not a ticket.`)
                .setColor(colors.invisible as ColorResolvable),
            ],
            ephemeral: true,
          });
        }

        if (guildData?.loggingEnabled && guildData.loggingChannel) {
          const guild = interaction.guild as Guild;
          const loggingChannel = guild.channels.cache.get(guildData.loggingChannel);
          if (loggingChannel instanceof TextChannel) {
            await loggingChannel.send({
              embeds: [
                new MessageEmbed()
                  .setTitle(`${emoji.ticket} Ticket Closed`)
                  .setColor(colors.invisible as ColorResolvable)
                  .setDescription(`${user} closed the ticket \`#${(channel as TextChannel).name}\`.${guildData.transcriptsEnabled ? `\n[Transcript](http://suta.tk/transcripts/${(channel as TextChannel).id})` : ''}`)
                  .setTimestamp(),
              ],
            });
          }
        }
        if (guildData?.transcriptsEnabled) {
          const transcript = await createTranscript(channel as TextChannel, {
            returnType: 'string',
            minify: true,
          });

          guildData?.transcripts?.push({
            name: (channel as TextChannel).id, data: transcript as string,
          });

          await guildData.save();

          interaction.user.send({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.ticket} Ticket Closed`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`\
  ${user} closed the ticket \`#${(channel as TextChannel).name}\`.
  To view the transcript, click [here](http://suta.tk/transcripts/${(channel as TextChannel).id}).`)
                .setTimestamp(),
            ],
          }).catch(() => { });
        }

        channel?.delete('Suta | Closed Ticket')
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

        (tickets as any).pull(ticket);
        await guildData.save();
      }
    }

    if (interaction.isSelectMenu()) {
      const { guildId, user, guild } = interaction;
      let guildData = await GuildSchema.findOne({ guildId });
      if (!guildData) guildData = new GuildSchema({ guildId });

      const ticketTopics = guildData?.ticketCategories?.map((category: TicketCategory) => `ticket-${category.name}`);
      if (!ticketTopics?.includes(interaction.values[0] as string)) return;

      const {
        ticketCategories, tickets, maxTickets, supportRole, adminRole, ticketCategory,
      } = guildData;
      const { loggingChannel } = guildData;

      const menuChannel = interaction.channel as TextChannel;
      const menuMessage = await menuChannel?.messages.fetch(interaction.message.id);
      menuMessage.edit({ components: menuMessage.components });

      if (
        !ticketCategory
        || !ticketCategories
        || !maxTickets
        || !supportRole
        || !adminRole
        || !loggingChannel
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} Ticket System Error.`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription('The ticket system is not setup. Use `/settings` to set it up.'),
          ],
          ephemeral: true,
        });
      }

      const occurances = tickets.filter((ticket: Ticket) => ticket.creatorId === user.id).length;
      if (occurances >= maxTickets) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You have reached the maximum amount of tickets.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const category = ticketCategories.find((
        c: TicketCategory,
      ) => c.name === interaction.values[0]?.substring(7));

      if (!category) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This category does not exist.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const ticketCat = guild?.channels.cache.get(ticketCategory) as CategoryChannel;

      await ticketCat.createChannel(`ticket-${user.username}`, {
        type: 'GUILD_TEXT',
        topic: `${user.username}'s Ticket. To close, use /ticket close`,
        reason: 'Suta | Ticket Creation',
        permissionOverwrites: [
          {
            id: guild?.roles.everyone.id as string,
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: user.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
          },
          {
            id: supportRole,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
          },
          {
            id: adminRole,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
          },
        ],
      }).then(async (newChannel: TextChannel) => {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.ticket} Ticket Created.`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription(`Your ticket has been created, ${newChannel}.`),
          ],
          ephemeral: true,
        });

        tickets.push({
          creatorId: user.id,
          channelId: newChannel.id,
          guildId: interaction.guildId as string,
          createdAt: new Date().toISOString(),
          claimed: false,
          addedUsers: [],
        });
        await guildData?.save();

        if (category.ticketText) {
          newChannel.send({
            content: category.ticketText.replace('{user}', `<@${user.id}>`),
            embeds: [
              new MessageEmbed()
                .setTitle(`${category.emoji} ${interaction.values[0]?.substring(7)} | Ticket`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`${(category.embedDesc || category.description || 'Hello {user}! Please explain your issue further').replace('{user}', `<@${user.id}>`).replace(/\\n/g, '\n')}`)
                .setTimestamp(),
            ],
            components: [
              new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId('ticket-close')
                    .setLabel('Close Ticket')
                    .setStyle('DANGER')
                    .setEmoji('🔒'),
                ),
            ],
          });
        } else {
          newChannel.send({
            embeds: [
              new MessageEmbed()
                .setTitle(`${category.emoji} ${interaction.values[0]?.substring(7)} | Ticket`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`${(category.embedDesc || category.description || 'Hello {user}! Please explain your issue further').replace('{user}', `<@${user.id}>`).replace(/\\n/g, '\n')}`)
                .setTimestamp(),
            ],
            components: [
              new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId('ticket-close')
                    .setLabel('Close Ticket')
                    .setStyle('DANGER')
                    .setEmoji('🔒'),
                ),
            ],
          }).catch(() => interaction.reply({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.wrong} Ticket System Error.`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`\
Please make sure I have permission to create channels in the ticket category.
Please join our support server for more information. \`/support\``),
            ],
            ephemeral: true,
          }));
        }

        if (guildData?.loggingEnabled && guildData.loggingChannel) {
          const guild = interaction.guild as Guild;
          const loggingChannel = guild.channels.cache.get(guildData.loggingChannel);
          if (loggingChannel instanceof TextChannel) {
            await loggingChannel.send({
              embeds: [
                new MessageEmbed()
                  .setTitle(`${emoji.ticket} Ticket Opened`)
                  .setColor(colors.invisible as ColorResolvable)
                  .setDescription(`${user} opened a ticket \`#${newChannel.name}\`.`)
                  .setTimestamp(),
              ],
            });
          }
        }
      });
    }
  }
}
