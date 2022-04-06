import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import {
  CategoryChannel, ColorResolvable, Interaction, MessageActionRow, MessageButton, MessageEmbed, TextChannel,
} from 'discord.js';
import { Category } from '../typings/category';
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

    if (interaction.isButton()) {
      if (interaction.customId === 'ticket-close') {
        const { guildId, user, channel } = interaction;
        let guildData = await GuildSchema.findOne({ guildId });
        if (!guildData) guildData = new GuildSchema({ guildId });

        const { tickets } = guildData;
        const ticket = tickets.find((t: Ticket) => t.creatorId === user.id && t.channelId === interaction.channelId);

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

        tickets.pull(ticket);
        await guildData.save();
        channel?.delete('Suta | Closed Ticket');
      }
    }

    if (interaction.isSelectMenu()) {
      const { guildId, user, guild } = interaction;
      let guildData = await GuildSchema.findOne({ guildId });
      if (!guildData) guildData = new GuildSchema({ guildId });

      const ticketTopics = guildData.ticketCategories.map((category: Category) => `ticket-${category.name}`);
      if (!ticketTopics.includes(interaction.values[0])) return;

      const {
        ticketCategories, tickets, maxTickets, supportRole, adminRole, ticketCategory,
      } = guildData;
      const { channel } = guildData.ticketMenu;

      if (!ticketCategory || !ticketCategories || !maxTickets || !supportRole || !adminRole || !channel) {
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

      const menuChannel = interaction.channel as TextChannel;
      const menuMessage = await menuChannel?.messages.fetch(interaction.message.id);
      menuMessage.edit({ components: menuMessage.components });

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

      const category = ticketCategories.find((c: Category) => c.name === interaction.values[0]?.substring(7));
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
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: supportRole,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: adminRole,
            allow: ['VIEW_CHANNEL'],
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

        if (category.ticketText) {
          newChannel.send({
            content: category.ticketText.replace('{user}', user).replace('\n', '\\n'),
            embeds: [
              new MessageEmbed()
                .setTitle(`${category.emoji} ${interaction.values[0]?.substring(7)} | Ticket`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription(`${(category.embedDesc || category.description).replace('{user}', user).replace('\n', '\\n')}`)
                .setTimestamp(),
            ],
            components: [
              new MessageActionRow().addComponents(
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
                .setDescription(`${(category.embedDesc || category.description).replace('{user}', user).replace('\n', '\\n')}`)
                .setTimestamp(),
            ],
            components: [
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId('ticket-close')
                  .setLabel('Close Ticket')
                  .setStyle('DANGER')
                  .setEmoji('🔒'),
              ),
            ],
          });
        }

        await tickets.push({
          creatorId: user.id,
          channelId: newChannel.id,
          guildId: interaction.guildId,
          createdAt: new Date().toISOString(),
          claimed: false,
          addedUsers: [],
        });
        await guildData.save();
      });
    }
  }
}
