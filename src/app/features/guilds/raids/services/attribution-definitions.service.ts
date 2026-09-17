import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateGuildAttributionDefinitionPayload,
  GuildAttributionDefinition,
  GuildAttributionDefinitionPayload,
  SetAttributionSectionIconPayload,
} from '../models/guild-attribution-definition.model';
import { RaidBoss } from '../models/raid-boss.model';
import { RaidZone } from '../models/raid-zone.model';
import { Spell } from '../models/spell.model';

/** Thin HTTP wrapper over `api/v1/guilds/{guildId}/attribution-definitions` and the spell search endpoint — guild-wide, no branch scope. */
@Service()
export class AttributionDefinitionsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string): string {
    return `${this.#api}/guilds/${guildId}`;
  }

  /** Returns the guild's raid-attribution template for one scope ("General", or one specific boss), ordered for display. */
  getDefinitions(guildId: string, raidBossId: number | null): Observable<GuildAttributionDefinition[]> {
    return this.#http.get<GuildAttributionDefinition[]>(`${this.#base(guildId)}/attribution-definitions`, {
      params: raidBossId != null ? { raidBossId } : {},
    });
  }

  createDefinition(guildId: string, payload: CreateGuildAttributionDefinitionPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId)}/attribution-definitions`, payload);
  }

  /** Returns the union of raid zones available across every active branch of the guild — backs the template editor's "raid" scope picker. */
  getRaidZonesForGuild(guildId: string): Observable<RaidZone[]> {
    return this.#http.get<RaidZone[]>(`${this.#base(guildId)}/raid-zones`);
  }

  /** Returns every boss of one raid zone — backs the template editor's boss picker once a raid is chosen. */
  getBossesForZone(guildId: string, raidZoneId: number): Observable<RaidBoss[]> {
    return this.#http.get<RaidBoss[]>(`${this.#base(guildId)}/raid-zones/${raidZoneId}/bosses`);
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

  /** Sets the section-header icon shown above every row sharing one (scope, section) tuple. */
  setSectionIcon(guildId: string, payload: SetAttributionSectionIconPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId)}/attribution-definitions/sections/icon`, payload);
  }

  /** Searches the seeded spell reference table by localized name substring. */
  searchSpells(guildId: string, expansionId: number, searchTerm: string, locale: string): Observable<Spell[]> {
    return this.#http.get<Spell[]>(`${this.#base(guildId)}/spells/search`, {
      params: { expansionId, searchTerm, locale },
    });
  }
}
