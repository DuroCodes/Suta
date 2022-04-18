/* eslint-disable no-param-reassign */
import {
  isThenable, roundNumber, codeBlock, filterNullAndUndefinedAndEmpty,
} from '@sapphire/utilities';
import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework';
import { fetch, FetchMethods, FetchResultTypes } from '@sapphire/fetch';
import { canSendMessages } from '@sapphire/discord.js-utilities';
import { setTimeout as sleep } from 'node:timers/promises';
import { CommandInteraction, Message } from 'discord.js';
import type { APIMessage } from 'discord-api-types/v9';
import { ApplyOptions } from '@sapphire/decorators';
import { hideLinkEmbed } from '@discordjs/builders';
import { Time } from '@sapphire/time-utilities';
import { Stopwatch } from '@sapphire/stopwatch';
import { inspect, promisify } from 'node:util';
import { Command } from '@sapphire/framework';
import { exec } from 'child_process';
import Type from '@sapphire/type';
import { bold } from 'chalk';

const seconds = (seconds: number): number => seconds * Time.Second;
seconds.fromMilliseconds = (milliseconds: number): number => roundNumber(milliseconds / Time.Second);

interface HastebinResponse {
  key: string;
}

interface EvalReplyParameters {
  hastebinUnavailable: boolean;
  replyUnavailable: boolean;
  consoleUnavailable: boolean;
  fileUnavailable: boolean;
  execUnavailable: boolean;
  url: string | null;
  code: string;
  success: boolean;
  result: string;
  time: string;
  footer: string;
  language: string;
  outputTo: 'reply' | 'file' | 'hastebin' | 'console' | 'exec' | 'none';
}

interface EvalParameters {
  message: Message;
  code: string;
  async: boolean;
  showHidden: boolean;
  depth: number;
  timeout: number;
}

@ApplyOptions<CommandOptions>({
  chatInputCommand: {
    register: true,
  },
  description: 'Evaluate code with Suta.',
  enabled: true,
  name: 'eval',
  fullCategory: ['Utility', 'Administration'],
  preconditions: ['OwnerOnly'],
})

export class UserCommand extends Command {
  readonly #timeout = 60_000;

  readonly #language: Array<{ name: string, value: string; }> = [
    {
      name: 'JavaScript',
      value: 'js',
    },
    {
      name: 'TypeScript',
      value: 'ts',
    },
    {
      name: 'Raw Text',
      value: 'txt',
    },
    {
      name: 'JSON',
      value: 'json',
    },
  ];

  readonly #outputChoices: Array<{ name: string, value: string; }> = [
    {
      name: 'Reply',
      value: 'reply',
    },
    {
      name: 'File',
      value: 'file',
    },
    {
      name: 'Hastebin',
      value: 'hastebin',
    },
    {
      name: 'Console',
      value: 'console',
    },
    {
      name: 'Exec',
      value: 'exec',
    },
    {
      name: 'None',
      value: 'none',
    },
  ];

  public override async chatInputRun(interaction: CommandInteraction) {
    const message = await interaction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    const code = interaction.options.getString('code') as string;
    const depth = interaction.options.getInteger('depth') ?? 0;
    const language = interaction.options.getString('language') ?? 'ts';
    const outputTo = interaction.options.getString('output-to') ?? 'reply';
    const async = interaction.options.getBoolean('async') ?? false;
    const noTimeout = interaction.options.getBoolean('no-timeout') ?? false;
    const silent = interaction.options.getBoolean('silent') ?? false;
    const showHidden = interaction.options.getBoolean('show-hidden') ?? false;

    const timeout = noTimeout ? Infinity : this.#timeout;

    const {
      success, result, time, type,
    } = await this.timedEval(interaction, {
      message: message as Message,
      async,
      code,
      depth,
      showHidden,
      timeout,
    });

    if (silent) {
      if (!success && result && (result as unknown as Error['stack'])) {
        this.container.logger.fatal(result as unknown as Error['stack']);
      }
    }

    const footer = codeBlock('ts', type);

    return this.handleReply(interaction, {
      hastebinUnavailable: false,
      replyUnavailable: false,
      fileUnavailable: false,
      consoleUnavailable: true,
      execUnavailable: true,
      code,
      url: null,
      success,
      result,
      time,
      footer,
      language,
      outputTo: outputTo as 'reply' | 'file' | 'hastebin' | 'console' | 'exec' | 'none',
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultPermission(true)
      .addStringOption((option) => option
        .setName('code')
        .setDescription('Code to evaluate.')
        .setRequired(true))
      .addIntegerOption((option) => option
        .setName('depth')
        .setDescription('Maximum depth of the result.'))
      .addStringOption((option) => option
        .setName('language')
        .setDescription('The language of the output code block.')
        .setChoices(...this.#language))
      .addStringOption((option) => option
        .setName('output-to')
        .setDescription('Where to output the result.')
        .setChoices(...this.#outputChoices))
      .addBooleanOption((option) => option
        .setName('async')
        .setDescription('Whether to evaluate the code asynchronously.'))
      .addBooleanOption((option) => option
        .setName('no-timeout')
        .setDescription('Whether to disable the timeout.'))
      .addBooleanOption((option) => option
        .setName('silent')
        .setDescription('Whether to disable the output.'))
      .addBooleanOption((option) => option
        .setName('show-hidden')
        .setDescription('Whether to show hidden properties.')));
  }

  private timedEval(
    interaction: CommandInteraction,
    { timeout, ...evalParameters }: EvalParameters,
  ) {
    if (timeout === Infinity || timeout === 0) return this.eval(interaction, { timeout, ...evalParameters });
    return Promise.race([
      sleep(timeout).then(() => ({
        result: `Eval took more than ${seconds.fromMilliseconds(timeout)} seconds.`,
        success: false,
        time: '⏱...',
        type: 'EvalTimeoutError',
      })),
      this.eval(interaction, { timeout, ...evalParameters }),
    ]);
  }

  private clean = (text: string) => text.replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);

  private async eval(
    _interaction: CommandInteraction,
    {
      message, code, async, depth, showHidden,
    }: EvalParameters,
  ) {
    const stopwatch = new Stopwatch();
    let success: boolean;
    let syncTime = '';
    let asyncTime = '';
    let result: unknown;
    let thenable = false;
    let type: Type | null = null;

    try {
      if (async) code = `(async () => {\n${code}\n})()`;

      // @ts-expect-error value is never read, this is so `msg` is possible as an alias when sending the eval.
      const msg = message;

      // @ts-expect-error value is never read, this is so `msg` is possible as an alias when sending the eval.
      const interaction = _interaction;

      // eslint-disable-next-line no-eval
      result = eval(code);
      syncTime = stopwatch.toString();
      type = new Type(result);
      if (isThenable(result)) {
        thenable = true;
        stopwatch.restart();
        result = await result;
        asyncTime = stopwatch.toString();
      }
      success = true;
    } catch (err) {
      if (!syncTime.length) syncTime = stopwatch.toString();
      if (thenable && !asyncTime.length) asyncTime = stopwatch.toString();
      if (!type) type = new Type(err);
      result = err;
      success = false;
    }

    stopwatch.stop();
    if (typeof result !== 'string') {
      result = result instanceof Error
        ? result.stack
        : inspect(result, { depth, showHidden });
    }
    return {
      success,
      type,
      time: this.formatTime(syncTime, asyncTime),
      result: this.clean(result as string),
    };
  }

  private async handleReply(
    interaction: CommandInteraction,
    options: EvalReplyParameters,
  ): Promise<APIMessage | Message<boolean> | null> {
    const typeFooter = ` ${bold('Type')}:${options.footer}`;
    const timeTaken = options.time;
    switch (options.outputTo) {
      case 'file': {
        if (canSendMessages(interaction.channel)) {
          const output = 'Sent the result as a file.';
          const content = [output, typeFooter, timeTaken] //
            .filter(filterNullAndUndefinedAndEmpty)
            .join('\n');

          const attachment = Buffer.from(options.result);
          const name = `output.${options.language}`;

          return interaction.editReply({ content, files: [{ attachment, name }] });
        }

        options.fileUnavailable = true;
        this.getOtherTypeOutput(options);

        return this.handleReply(interaction, options);
      }
      case 'hastebin': {
        if (!options.url) {
          options.url = await this.getHaste(options.result, options.language).catch(
            () => null,
          );
        }

        if (options.url) {
          const hastebinUrl = `Sent the result to hastebin: ${hideLinkEmbed(
            options.url,
          )}`;

          const content = [hastebinUrl, typeFooter, timeTaken] //
            .filter(filterNullAndUndefinedAndEmpty)
            .join('\n');

          return interaction.editReply({ content });
        }

        options.hastebinUnavailable = true;

        this.getOtherTypeOutput(options);

        return this.handleReply(interaction, options);
      }
      case 'console': {
        this.container.logger.info(options.result);
        const output = 'Sent the result to console.';

        const content = [output, typeFooter, timeTaken] //
          .filter(filterNullAndUndefinedAndEmpty)
          .join('\n');

        return interaction.editReply({ content });
      }
      case 'exec': {
        try {
          const { stdout, stderr } = await promisify(exec)(options.code);

          if (!stdout && !stderr) {
            this.container.logger.warn('No output from exec.');
          }

          if (stdout.length > 1950) {
            options.url = await this.getHaste(stdout, options.language).catch(
              () => null,
            );
          }

          if (options.url) {
            const hastebinUrl = `Enviado el resultado a hastebin: ${hideLinkEmbed(
              options.url,
            )}`;

            const content = [hastebinUrl] //
              .filter(filterNullAndUndefinedAndEmpty)
              .join('\n');
            return interaction.editReply({ content });
          }

          const output = codeBlock(options.language, stdout);

          const content = `${bold('Input')}:${output}\n${options.time}`;

          return interaction.editReply({ content });
        } catch (err) {
          const output = codeBlock(options.language, err);
          const content = `${bold('Error')}\n${output}\n${options.time}`;

          return interaction.editReply({ content });
        }
      }
      case 'none': {
        return interaction.editReply({ content: 'Aborted!' });
      }
      case 'reply':
      default: {
        if (options.result.length > 1950) {
          options.replyUnavailable = true;
          this.getOtherTypeOutput(options);

          return this.handleReply(interaction, options);
        }

        if (options.success) {
          const parsedInput = `${bold('Input')}:${codeBlock(
            options.language,
            options.code,
          )}`;
          const parsedOutput = `${bold('Output')}:${codeBlock(
            options.language,
            options.result,
          )}`;

          const content = [parsedInput, parsedOutput, typeFooter, timeTaken]
            .filter(Boolean)
            .join('\n');
          return interaction.editReply({ content });
        }

        const output = codeBlock(options.language, options.result);
        const content = `${bold('Error')}:${output}\n${bold('Type')}:${options.footer}\n${options.time}`;
        return interaction.editReply({ content });
      }
    }
  }

  private getOtherTypeOutput(options: EvalReplyParameters) {
    if (!options.replyUnavailable) {
      options.outputTo = 'reply';
      return;
    }

    if (!options.hastebinUnavailable) {
      options.outputTo = 'hastebin';
      return;
    }

    if (!options.fileUnavailable) {
      options.outputTo = 'file';
      return;
    }

    if (!options.consoleUnavailable) {
      options.outputTo = 'console';
      return;
    }

    if (!options.execUnavailable) {
      options.outputTo = 'exec';
      return;
    }

    options.outputTo = 'none';
  }

  private formatTime = (syncTime: string, asyncTime?: string) => (asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`);

  private async getHaste(result: string, language = 'js') {
    const { key } = await fetch<HastebinResponse>(
      'https://hastebin.skyra.pw/documents',
      {
        method: FetchMethods.Post,
        body: result,
      },
      FetchResultTypes.JSON,
    );
    return `https://hastebin.skyra.pw/${key}.${language}`;
  }
}
