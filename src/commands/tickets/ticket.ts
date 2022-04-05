import {
  ColorResolvable, CommandInteraction, Guild, GuildMember, MessageActionRow, MessageEmbed, MessageSelectMenu, TextChannel, User,
} from 'discord.js';
import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import GuildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';
import { Category } from '../../typings/category';
import { Ticket } from '../../typings/ticket';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Commands for tickets.',
  enabled: true,
  name: 'ticket',
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

    async function menu() {
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

      if (guildData.ticketCategories.length < 1) {
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
      } = guildData.ticketMenu;

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

      const reasons = guildData.ticketCategories.map((category: Category) => {
        const {
          emoji: emojiName, description, name: label,
        } = category;
        return {
          emoji: emojiName, description, label, value: `ticket-${label}`,
        };
      });

      const dropdown = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('ticket-menu')
          .setPlaceholder('Select a ticket category...')
          .setOptions(reasons),
      );

      const embed = new MessageEmbed()
        .setTitle(title)
        .setColor(color)
        .setDescription(`${description ? `${description}\n` : ''}${guildData.ticketCategories.map((category: Category) => `${category.emoji} - ${category.name}`).join('\n')}`);

      if (footer) embed.setFooter({ text: footer });
      if (timestamp) embed.setTimestamp();

      ticketChannel.send({
        embeds: [embed],
        components: [dropdown],
      });
    }

    async function add(user: User) {
      if (!roles.cache.has(guildData?.supportRole) && !permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You do not have permission to use this command.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const { tickets } = guildData;

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
      if (ticket.addedUsers.includes(user.id)) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} This user is already been added to the ticket.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      ticket.addedUsers.push((user.id).toString());
      await guildData.save();

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
      if (!roles.cache.has(guildData?.supportRole) && !permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} You do not have permission to use this command.`)
              .setColor(colors.invisible as ColorResolvable),
          ],
          ephemeral: true,
        });
      }

      const { tickets } = guildData;

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

      ticket.addedUsers.pull((user.id).toString());
      await guildData.save();

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
      const { tickets } = guildData;
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
      await guildData.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.create(guildData.supportRole, {
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
      const { tickets } = guildData;
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
      await guildData.save();

      const channel = interaction?.channel as TextChannel;
      channel.permissionOverwrites.create(guildData.supportRole, {
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
      const { tickets } = guildData;
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
      const { tickets } = guildData;
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

      guildData.tickets.pull(ticket);
      await guildData.save();

      const channel = interaction.channel as TextChannel;
      channel.delete('Suta 💫 | Ticket Closed');
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
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand((sub) => sub
        .setName('menu')
        .setDescription('Create a ticket creation menu.'))
      .addSubcommand((sub) => sub
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption((user) => user
          .setName('user')
          .setDescription('The user to add to the ticket.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Remove a user from the ticket.')
        .addUserOption((user) => user
          .setName('user')
          .setDescription('The user to remove from the ticket.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('claim')
        .setDescription('Claim the ticket.'))
      .addSubcommand((sub) => sub
        .setName('unclaim')
        .setDescription('Unclaim the ticket.'))
      .addSubcommand((sub) => sub
        .setName('rename')
        .setDescription('Rename the ticket.')
        .addStringOption((string) => string
          .setName('name')
          .setDescription('The new name for the ticket.')
          .setRequired(true)))
      .addSubcommand((sub) => sub
        .setName('close')
        .setDescription('Close the ticket.')));
  }
}
