import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { GuildRosterMember } from '../../models/guild-roster-member.model';

@Service()
export class GuildRosterStore {
  readonly #guildId = signal<string | null>(null);
  readonly #guildBranchId = signal<number | null>(null);

  readonly #rosterResource = httpResource<GuildRosterMember[]>(() => {
    const guildId = this.#guildId();
    const guildBranchId = this.#guildBranchId();
    return guildId != null && guildBranchId != null
      ? { url: `${environment.apiUrl}/guilds/${guildId}/roster`, params: { guildBranchId } }
      : undefined;
  });

  readonly members = computed(() => this.#rosterResource.value() ?? null);
  readonly isLoading = this.#rosterResource.isLoading;

  /**
   * Points the store at a guild branch's roster and forces a fresh fetch — the roster can be
   * edited by other officers/players between visits, so cached data can't be trusted on its own.
   * Setting the signals already triggers httpResource's own refetch when either changes;
   * reload() covers the case where the same guild+branch is requested again (a no-op signal
   * write on its own).
   */
  loadRoster(guildId: string, guildBranchId: number): void {
    if (this.#guildId() === guildId && this.#guildBranchId() === guildBranchId) {
      this.#rosterResource.reload();
    } else {
      this.#guildId.set(guildId);
      this.#guildBranchId.set(guildBranchId);
    }
  }

  /** Re-fetches the current guild's roster without changing which guild is tracked. */
  reload(): void {
    this.#rosterResource.reload();
  }
}
