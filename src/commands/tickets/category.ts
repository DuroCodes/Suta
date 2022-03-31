import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import {
  ColorResolvable, CommandInteraction, Message, MessageEmbed, MessageReaction, User, GuildMember,
} from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import guildSchema from '../../schemas/guild';
import colors from '../../util/colors.json';
import emoji from '../../util/emoji.json';

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Customize a category.',
  enabled: true,
  name: 'category',
  fullCategory: ['Tickets'],
})

export class UserCommand extends Command {
  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
      ],
    });
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

    const category = interaction.options.get('category')?.value as string;
    const check = (cat: string) => guildData.ticketCategories.some((c: any) => c.name === cat);

    if (check(category)) {
      const embed = new MessageEmbed()
        .setTitle(`${emoji.correct} Category Confirmation`)
        .setColor(colors.invisible as ColorResolvable)
        .setDescription(`\
Would you like to remove or edit the category \`${category}\`?
React with ${emoji.delete} to **remove** the category.
React with ${emoji.edit} to **edit** the category.
React with ${emoji.wrong} to **cancel**.`);

      const reply = await interaction.reply({ embeds: [embed], fetchReply: true }) as Message;
      reply.react(emoji.delete)
        .then(() => reply.react(emoji.edit))
        .then(() => reply.react(emoji.wrong));

      const filter = (reaction: MessageReaction, user: User) => ['icons_delete', 'icons_edit', 'icons_Wrong'].includes(reaction.emoji.name as string) && user.id === interaction.user.id;
      const collector = reply.createReactionCollector({ filter, time: 15000 });

      async function deleteCategory(cat: string) {
        await guildData.updateOne({ $pull: { ticketCategories: { name: cat } } });
        await guildData.save();
        const deleted = new MessageEmbed()
          .setTitle(`${emoji.delete} Category Deleted`)
          .setColor(colors.invisible as ColorResolvable)
          .setDescription(`Successfully deleted category \`${cat}\``);
        reply.edit({ embeds: [deleted] });
        reply.reactions.removeAll();
      }

      async function editCategory(cat: string) {
        const editFilter = (m: Message) => m.author.id === interaction.user.id;
        reply.edit({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.edit} Category Edit`)
              .setColor(colors.invisible as ColorResolvable)
              .setDescription('Type the name you wish the category to be. You have **15 seconds**.'),
          ],
        });

        const messageCollector = reply.channel.createMessageCollector({
          filter: editFilter, time: 15000,
        });

        messageCollector.on('collect', async (m: Message) => {
          if (m.content.length > 0) {
            const newName = m.content;
            await guildData.updateOne({ $pull: { ticketCategories: { name: cat } } });
            await guildData.updateOne({ $push: { ticketCategories: { name: newName } } });
            await guildData.save();
            reply.edit({
              embeds: [
                new MessageEmbed()
                  .setTitle(`${emoji.edit} Category Edited`)
                  .setColor(colors.invisible as ColorResolvable)
                  .setDescription(`Changed category name from \`${cat}\` to \`${newName}\``),
              ],
            });
            reply.reactions.removeAll();
          }
        });

        messageCollector.on('end', () => {
          reply.reactions.removeAll();
          reply.edit({
            embeds: [
              new MessageEmbed()
                .setTitle(`${emoji.timer} Category Edit`)
                .setColor(colors.invisible as ColorResolvable)
                .setDescription('Category edit timed out.'),
            ],
          });
        });
      }

      async function cancel() {
        reply.edit({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} Category Cancelled`)
              .setColor(colors.invisible as ColorResolvable),
          ],
        });
        reply.reactions.removeAll();
      }

      collector.on('collect', (reaction: MessageReaction) => {
        switch (reaction.emoji.name as string) {
          case 'icons_delete':
            deleteCategory(category);
            break;
          case 'icons_edit':
            editCategory(category);
            break;
          case 'icons_Wrong':
            cancel();
            break;
          default:
            break;
        }
      });

      collector.on('end', () => {
        reply.reactions.removeAll();
      });
    } else {
      const embed = new MessageEmbed()
        .setTitle(`${emoji.correct} Category Confirmation`)
        .setColor(colors.invisible as ColorResolvable)
        .setDescription(`\
Would you like to create the category \`${category}\`?
React with ${emoji.correct} to **create** the category.
React with ${emoji.wrong} to **cancel**.`);

      const reply = await interaction.reply({ embeds: [embed], fetchReply: true }) as Message;
      reply.react(emoji.correct).then(() => reply.react(emoji.wrong));

      const filter = (reaction: MessageReaction, user: User) => ['icons_Correct', 'icons_Wrong'].includes(reaction.emoji.name as string) && user.id === interaction.user.id;
      const collector = reply.createReactionCollector({ filter, time: 15000 });

      async function create(cat: string) {
        await guildData.ticketCategories.push({ name: cat });
        await guildData.save();
        reply.edit({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.correct} Category Created`)
              .setColor(colors.invisible as ColorResolvable),
          ],
        });
        reply.reactions.removeAll();
      }

      async function cancel() {
        reply.edit({
          embeds: [
            new MessageEmbed()
              .setTitle(`${emoji.wrong} Category Cancelled`)
              .setColor(colors.invisible as ColorResolvable),
          ],
        });
        reply.reactions.removeAll();
      }

      collector.on('collect', async (reaction: MessageReaction) => {
        switch (reaction.emoji.name as string) {
          case 'icons_Correct':
            create(category);
            break;
          case 'icons_Wrong':
            cancel();
            break;
          default:
            break;
        }
      });
    }
  }
}
