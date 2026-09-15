import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { GuildAttributionDefinition } from '../../raids/models/guild-attribution-definition.model';

@Service()
export class AttributionDefinitionsStore {
  readonly #guildId = signal<string | null>(null);

  readonly #definitionsResource = httpResource<GuildAttributionDefinition[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/attribution-definitions` : undefined;
  });

  readonly definitions = computed(() => this.#definitionsResource.value() ?? []);
  readonly isLoading = computed(() => this.#definitionsResource.isLoading());

  load(guildId: string): void {
    this.#guildId.set(guildId);
  }

  reload(): void {
    this.#definitionsResource.reload();
  }
}
