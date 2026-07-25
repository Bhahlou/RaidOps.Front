import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { RaidZone } from '../models/raid-zone.model';

interface ZoneKey {
  guildId: string;
  branchId: number;
}

/** Raid zones (reference data) available for a given guild/branch — e.g. only SSC/TK for TBC. */
@Service()
export class RaidZoneStore {
  readonly #key = signal<ZoneKey | null>(null);

  readonly #zonesResource = httpResource<RaidZone[]>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/raids/zones?branchId=${key.branchId}`;
  });

  readonly zones = computed(() => this.#zonesResource.value() ?? []);
  readonly isLoading = this.#zonesResource.isLoading;

  /** Points the store at a guild/branch's raid zone list. Reference data — no forced reload on re-request. */
  load(guildId: string, branchId: number): void {
    const next: ZoneKey = { guildId, branchId };
    const current = this.#key();
    if (!current || current.guildId !== next.guildId || current.branchId !== next.branchId) {
      this.#key.set(next);
    }
  }
}
