import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GuildRosterMember } from '../models/guild-roster-member.model';

@Service()
export class GuildRosterStore {
  readonly #guildId = signal<string | null>(null);

  readonly #rosterResource = httpResource<GuildRosterMember[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/roster` : undefined;
  });

  readonly members = computed(() => this.#rosterResource.value() ?? null);
  readonly isLoading = this.#rosterResource.isLoading;

  /**
   * Points the store at a guild's roster and forces a fresh fetch — the roster can be edited by
   * other officers/players between visits, so cached data can't be trusted on its own. Setting the
   * guildId signal already triggers httpResource's own refetch when it changes; reload() covers
   * the case where the same guildId is requested again (a no-op signal write on its own).
   */
  loadRoster(guildId: string): void {
    if (this.#guildId() === guildId) {
      this.#rosterResource.reload();
    } else {
      this.#guildId.set(guildId);
    }
  }

  /** Re-fetches the current guild's roster without changing which guild is tracked. */
  reload(): void {
    this.#rosterResource.reload();
  }
}
