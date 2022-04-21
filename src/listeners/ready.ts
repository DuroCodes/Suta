import { Listener, type ListenerOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { bold } from 'chalk';

@ApplyOptions<ListenerOptions>({
  name: 'ready',
  once: true,
})

export class UserListener extends Listener {
  public run(): void {
    this.container.logger.info(`Logged in as ${bold(this.container.client.user?.tag)}`);
    this.container.client.user?.setStatus('idle');
    const updateStatus = () => this.container.client.user?.setActivity(`${this.container.client.guilds.cache.size} servers`, { type: 'LISTENING' });
    setInterval(updateStatus, 60_000);
  }
}
