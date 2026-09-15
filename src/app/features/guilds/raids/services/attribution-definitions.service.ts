import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { GuildAttributionDefinition, GuildAttributionDefinitionPayload } from '../models/guild-attribution-definition.model';
import { Spell } from '../models/spell.model';

/** Thin HTTP wrapper over `api/v1/guilds/{guildId}/attribution-definitions` and the spell search endpoint — guild-wide, no branch scope. */
@Service()
export class AttributionDefinitionsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string): string {
    return `${this.#api}/guilds/${guildId}`;
  }

  /** Returns the guild's raid-attribution template, ordered for display. */
  getDefinitions(guildId: string): Observable<GuildAttributionDefinition[]> {
    return this.#http.get<GuildAttributionDefinition[]>(`${this.#base(guildId)}/attribution-definitions`);
  }

  createDefinition(guildId: string, payload: GuildAttributionDefinitionPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId)}/attribution-definitions`, payload);
  }

  updateDefinition(guildId: string, definitionId: number, payload: GuildAttributionDefinitionPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId)}/attribution-definitions/${definitionId}`, payload);
  }

  deleteDefinition(guildId: string, definitionId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#base(guildId)}/attribution-definitions/${definitionId}`);
  }

  reorderDefinitions(guildId: string, orderedIds: number[]): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId)}/attribution-definitions/reorder`, { orderedIds });
  }

  /** Searches the seeded spell reference table by localized name substring. */
  searchSpells(guildId: string, expansionId: number, searchTerm: string, locale: string): Observable<Spell[]> {
    return this.#http.get<Spell[]>(`${this.#base(guildId)}/spells/search`, {
      params: { expansionId, searchTerm, locale },
    });
  }
}
