import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { DiscordChannel } from '../../../../shared/models/discord-channel.model';
import { GuildNotificationSetting } from '../models/guild-notification-setting.model';

@Service()
export class GuildNotificationSettingsStore {
  readonly #guildId = signal<string | null>(null);
  /** null = guild-wide row; a branch id resolves settings for that branch (falling back to guild-wide server-side). */
  readonly #guildBranchId = signal<number | null>(null);

  readonly #settingsResource = httpResource<GuildNotificationSetting[]>(() => {
    const guildId = this.#guildId();
    if (!guildId) return undefined;

    const guildBranchId = this.#guildBranchId();
    const params: Record<string, number> = guildBranchId != null ? { guildBranchId } : {};
    return { url: `${environment.apiUrl}/guilds/${guildId}/notification-settings`, params };
  });

  readonly #channelsResource = httpResource<DiscordChannel[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/notification-channels` : undefined;
  });

  readonly settings = computed(() => this.#settingsResource.value() ?? []);
  readonly channels = computed(() => this.#channelsResource.value() ?? []);

  load(guildId: string, guildBranchId: number | null = null): void {
    this.#guildId.set(guildId);
    this.#guildBranchId.set(guildBranchId);
  }

  /** Optimistically updates the cached settings after a successful save, without a re-fetch. */
  patchSettings(guildId: string, guildBranchId: number | null, settings: GuildNotificationSetting[]): void {
    this.#guildId.set(guildId);
    this.#guildBranchId.set(guildBranchId);
    this.#settingsResource.set(settings);
  }

  /** Re-fetches the current scope's settings — used after a reset, where the server-resolved values can't be derived locally. */
  reload(): void {
    this.#settingsResource.reload();
  }
}
