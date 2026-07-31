import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { RaidZone } from '../models/raid-zone.model';

interface ZoneKey {
  guildId: string;
  guildBranchId: number;
}

/** Raid zones (reference data) available for a given guild branch's WoW game version — e.g. only SSC/TK for TBC. */
@Service()
export class RaidZoneStore {
  readonly #key = signal<ZoneKey | null>(null);

  readonly #zonesResource = httpResource<RaidZone[]>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/raids/zones`;
  });

  readonly zones = computed(() => this.#zonesResource.value() ?? []);
  readonly isLoading = this.#zonesResource.isLoading;

  /** Points the store at a guild branch's raid zone list. Reference data — no forced reload on re-request. */
  load(guildId: string, guildBranchId: number): void {
    const next: ZoneKey = { guildId, guildBranchId };
    const current = this.#key();
    if (!current || current.guildId !== next.guildId || current.guildBranchId !== next.guildBranchId) {
      this.#key.set(next);
    }
  }
}
