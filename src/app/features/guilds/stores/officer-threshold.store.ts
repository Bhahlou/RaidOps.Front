import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { OfficerThreshold } from '../models/officer-threshold.model';

@Service()
export class OfficerThresholdStore {
  readonly #guildId = signal<string | null>(null);

  readonly #officerThresholdResource = httpResource<OfficerThreshold>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/officer-threshold` : undefined;
  });

  readonly officerThreshold = computed(() => this.#officerThresholdResource.value() ?? null);

  loadOfficerThreshold(guildId: string): void {
    this.#guildId.set(guildId);
  }

  /** Optimistically updates the cached threshold after a successful save, without a re-fetch. */
  patchOfficerThreshold(guildId: string, officerThreshold: OfficerThreshold): void {
    this.#guildId.set(guildId);
    this.#officerThresholdResource.set(officerThreshold);
  }
}
