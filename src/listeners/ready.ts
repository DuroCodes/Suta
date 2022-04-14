import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { bold } from 'chalk';
import { client } from '../main';

@ApplyOptions<ListenerOptions>({
  name: 'ready',
  once: true,
})

export class UserListener extends Listener {
  public run(): void {
    this.container.logger.info(`Logged in as ${bold(this.container.client.user?.tag)}`);
    client.user?.setStatus('idle');
    const updateStatus = () => client.user?.setActivity(`${client.guilds.cache.size} servers`, { type: 'LISTENING' });
    setInterval(updateStatus, 60_000);
  }
}
