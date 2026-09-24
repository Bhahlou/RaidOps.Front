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

/**
 * Thin HTTP wrapper over `api/v1/guilds/{guildId}/branches/{guildBranchId}/attribution-definitions` and
 * the spell search endpoint — every template is scoped to one guild branch (a guild running several
 * branches keeps one template per branch, since spells/classes/raids all depend on the branch's expansion).
 */
@Service()
export class AttributionDefinitionsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #guildBase(guildId: string): string {
    return `${this.#api}/guilds/${guildId}`;
  }

  #branchBase(guildId: string, guildBranchId: number): string {
    return `${this.#guildBase(guildId)}/branches/${guildBranchId}`;
  }

  /** Returns the branch's raid-attribution template for one scope ("General", or one specific boss), ordered for display. */
  getDefinitions(guildId: string, guildBranchId: number, raidBossId: number | null): Observable<GuildAttributionDefinition[]> {
    return this.#http.get<GuildAttributionDefinition[]>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions`, {
      params: raidBossId != null ? { raidBossId } : {},
    });
  }

  createDefinition(guildId: string, guildBranchId: number, payload: CreateGuildAttributionDefinitionPayload): Observable<void> {
    return this.#http.post<void>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions`, payload);
  }

  /** Returns the raid zones of the branch's expansion — backs the template editor's "raid" scope picker. */
  getRaidZones(guildId: string, guildBranchId: number): Observable<RaidZone[]> {
    return this.#http.get<RaidZone[]>(`${this.#branchBase(guildId, guildBranchId)}/raids/zones`);
  }

  /** Returns every boss of one raid zone — backs the template editor's boss picker once a raid is chosen. */
  getBossesForZone(guildId: string, raidZoneId: number): Observable<RaidBoss[]> {
    return this.#http.get<RaidBoss[]>(`${this.#guildBase(guildId)}/raid-zones/${raidZoneId}/bosses`);
  }

  updateDefinition(guildId: string, guildBranchId: number, definitionId: number, payload: GuildAttributionDefinitionPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions/${definitionId}`, payload);
  }

  deleteDefinition(guildId: string, guildBranchId: number, definitionId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions/${definitionId}`);
  }

  reorderDefinitions(guildId: string, guildBranchId: number, orderedIds: number[]): Observable<void> {
    return this.#http.post<void>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions/reorder`, { orderedIds });
  }

  /** Sets the section-header icon shown above every row sharing one (scope, section) tuple. */
  setSectionIcon(guildId: string, guildBranchId: number, payload: SetAttributionSectionIconPayload): Observable<void> {
    return this.#http.post<void>(`${this.#branchBase(guildId, guildBranchId)}/attribution-definitions/sections/icon`, payload);
  }

  /** Searches the spells of the branch's expansion by localized name substring — the server derives the expansion from the branch. */
  searchSpells(guildId: string, guildBranchId: number, searchTerm: string, locale: string): Observable<Spell[]> {
    return this.#http.get<Spell[]>(`${this.#branchBase(guildId, guildBranchId)}/spells/search`, {
      params: { searchTerm, locale },
    });
  }
}
