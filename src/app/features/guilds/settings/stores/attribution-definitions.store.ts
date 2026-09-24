import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { GuildAttributionDefinition } from '../../raids/models/guild-attribution-definition.model';

@Service()
export class AttributionDefinitionsStore {
  readonly #guildId = signal<string | null>(null);
  readonly #guildBranchId = signal<number | null>(null);
  readonly #raidBossId = signal<number | null>(null);

  readonly #definitionsResource = httpResource<GuildAttributionDefinition[]>(() => {
    const guildId = this.#guildId();
    const guildBranchId = this.#guildBranchId();
    if (!guildId || guildBranchId == null) return undefined;
    const raidBossId = this.#raidBossId();
    const params: Record<string, number> = raidBossId != null ? { raidBossId } : {};
    return { url: `${environment.apiUrl}/guilds/${guildId}/branches/${guildBranchId}/attribution-definitions`, params };
  });

  readonly definitions = computed(() => this.#definitionsResource.value() ?? []);
  readonly isLoading = computed(() => this.#definitionsResource.isLoading());

  /**
   * @param guildBranchId The guild branch whose template to load — each branch has its own.
   * @param raidBossId The scope to load — the boss's ID, or `null` for "General" rows.
   */
  load(guildId: string, guildBranchId: number, raidBossId: number | null): void {
    this.#guildId.set(guildId);
    this.#guildBranchId.set(guildBranchId);
    this.#raidBossId.set(raidBossId);
  }

  reload(): void {
    this.#definitionsResource.reload();
  }
}
