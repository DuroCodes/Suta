import {
  ColorResolvable, CommandInteraction, Guild, GuildMember, MessageActionRow, MessageEmbed, MessageSelectMenu, TextChannel,
} from 'discord.js';
import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import GuildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';
import { Category } from '../../typings/category';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Commands for tickets.',
  enabled: true,
  name: 'ticket',
  fullCategory: ['Tickets'],
})

export class UserCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    const { guildId } = interaction;
    const { roles } = interaction.member as GuildMember;
    const { permissions } = interaction.member as GuildMember;
    let guildData = await GuildSchema.findOne({ guildId });
    if (!guildData) guildData = await new GuildSchema({ guildId, ticketCategories: [], ticketMenu: {} });

    async function menu() {
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
        .setDescription(`\
${description}
${guildData.ticketCategories.map((category: Category) => `${category.emoji} - ${category.name}`).join('\n')}`);

      if (footer) embed.setFooter({ text: footer });
      if (timestamp) embed.setTimestamp();

      ticketChannel.send({
        embeds: [embed],
        components: [dropdown],
      });
    }

    switch (interaction.options.getSubcommand(true)) {
      case 'menu': {
        menu();
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
        .setDescription('Create a ticket creation menu.')));
  }
}
