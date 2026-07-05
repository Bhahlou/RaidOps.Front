import { httpResource } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GuildRosterMember } from '../models/guild-roster-member.model';

@Injectable({ providedIn: 'root' })
export class GuildRosterStore {
  readonly #guildId = signal<string | null>(null);
  readonly #reloadTrigger = signal(0);

  readonly #rosterResource = httpResource<GuildRosterMember[]>(() => {
    const guildId = this.#guildId();
    this.#reloadTrigger();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/roster` : undefined;
  });

  readonly members = computed(() => this.#rosterResource.value() ?? null);
  readonly isLoading = this.#rosterResource.isLoading;

  /**
   * Points the store at a guild's roster and forces a fresh fetch — the roster can be edited by
   * other officers/players between visits, so cached data can't be trusted on its own.
   */
  loadRoster(guildId: string): void {
    this.#guildId.set(guildId);
    this.#reloadTrigger.update((n) => n + 1);
  }

  /** Re-fetches the current guild's roster without changing which guild is tracked. */
  reload(): void {
    this.#reloadTrigger.update((n) => n + 1);
  }
}
