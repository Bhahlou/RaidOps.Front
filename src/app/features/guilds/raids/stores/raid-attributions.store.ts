import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { RaidEventAttributions } from '../models/raid-event-attributions.model';

/**
 * Two independent resources — "General" (guild-wide rows, always relevant regardless of which
 * boss is being viewed) and the currently selected boss's own rows, if any. Kept separate rather
 * than a single bossId-scoped resource because the Assignments page shows General permanently
 * alongside whichever boss is picked, not one or the other.
 */
@Service()
export class RaidAttributionsStore {
  readonly #guildId = signal<string | null>(null);
  readonly #guildBranchId = signal<number | null>(null);
  readonly #eventId = signal<number | null>(null);
  readonly #bossId = signal<number | null>(null);

  readonly #generalResource = httpResource<RaidEventAttributions>(() => {
    const guildId = this.#guildId();
    const guildBranchId = this.#guildBranchId();
    const eventId = this.#eventId();
    if (!guildId || guildBranchId == null || eventId == null) return undefined;
    return `${environment.apiUrl}/guilds/${guildId}/branches/${guildBranchId}/raids/events/${eventId}/attributions`;
  });

  readonly #bossResource = httpResource<RaidEventAttributions>(() => {
    const guildId = this.#guildId();
    const guildBranchId = this.#guildBranchId();
    const eventId = this.#eventId();
    const bossId = this.#bossId();
    if (!guildId || guildBranchId == null || eventId == null || bossId == null) return undefined;
    return {
      url: `${environment.apiUrl}/guilds/${guildId}/branches/${guildBranchId}/raids/events/${eventId}/attributions`,
      params: { bossId },
    };
  });

  readonly generalData = computed(() => this.#generalResource.value());
  readonly bossData = computed(() => this.#bossResource.value());
  readonly isLoading = computed(() => this.#generalResource.isLoading() || this.#bossResource.isLoading());

  /** @param bossId The boss currently selected in the nav, or `null` if none is — General still loads either way. */
  load(guildId: string, guildBranchId: number, eventId: number, bossId: number | null): void {
    this.#guildId.set(guildId);
    this.#guildBranchId.set(guildBranchId);
    this.#eventId.set(eventId);
    this.#bossId.set(bossId);
  }

  reload(): void {
    this.#generalResource.reload();
    this.#bossResource.reload();
  }
}
