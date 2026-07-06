import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GuildSettings } from '../models/guild-settings.model';

@Service()
export class GuildStore {
  readonly #guildId = signal<string | null>(null);

  readonly #settingsResource = httpResource<GuildSettings>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/settings` : undefined;
  });

  readonly settings = computed(() => this.#settingsResource.value() ?? null);

  loadSettings(guildId: string): void {
    this.#guildId.set(guildId);
  }

  /** Optimistically updates the cached settings after a successful save, without a re-fetch. */
  patchSettings(guildId: string, settings: GuildSettings): void {
    this.#guildId.set(guildId);
    this.#settingsResource.set(settings);
  }
}
