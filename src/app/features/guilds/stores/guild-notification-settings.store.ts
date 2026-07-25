import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DiscordChannel } from '../../../shared/models/discord-channel.model';
import { GuildNotificationSetting } from '../models/guild-notification-setting.model';

@Service()
export class GuildNotificationSettingsStore {
  readonly #guildId = signal<string | null>(null);

  readonly #settingsResource = httpResource<GuildNotificationSetting[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/notification-settings` : undefined;
  });

  readonly #channelsResource = httpResource<DiscordChannel[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/notification-channels` : undefined;
  });

  readonly settings = computed(() => this.#settingsResource.value() ?? []);
  readonly channels = computed(() => this.#channelsResource.value() ?? []);

  load(guildId: string): void {
    this.#guildId.set(guildId);
  }

  /** Optimistically updates the cached settings after a successful save, without a re-fetch. */
  patchSettings(guildId: string, settings: GuildNotificationSetting[]): void {
    this.#guildId.set(guildId);
    this.#settingsResource.set(settings);
  }
}
