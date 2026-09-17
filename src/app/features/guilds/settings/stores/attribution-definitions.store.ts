import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { GuildAttributionDefinition } from '../../raids/models/guild-attribution-definition.model';

@Service()
export class AttributionDefinitionsStore {
  readonly #guildId = signal<string | null>(null);
  readonly #raidBossId = signal<number | null>(null);

  readonly #definitionsResource = httpResource<GuildAttributionDefinition[]>(() => {
    const guildId = this.#guildId();
    if (!guildId) return undefined;
    const raidBossId = this.#raidBossId();
    const params: Record<string, number> = raidBossId != null ? { raidBossId } : {};
    return { url: `${environment.apiUrl}/guilds/${guildId}/attribution-definitions`, params };
  });

  readonly definitions = computed(() => this.#definitionsResource.value() ?? []);
  readonly isLoading = computed(() => this.#definitionsResource.isLoading());

  /** @param raidBossId The scope to load — the boss's ID, or `null` for "General" rows. */
  load(guildId: string, raidBossId: number | null): void {
    this.#guildId.set(guildId);
    this.#raidBossId.set(raidBossId);
  }

  reload(): void {
    this.#definitionsResource.reload();
  }
}
