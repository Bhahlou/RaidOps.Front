import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RaidBoss } from '../models/raid-boss.model';
import { RaidEventAttributions } from '../models/raid-event-attributions.model';

/** Thin HTTP wrapper over a raid event's Assignments tab endpoints. */
@Service()
export class RaidEventAttributionsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #eventBase(guildId: string, guildBranchId: number, eventId: number): string {
    return `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/raids/events/${eventId}`;
  }

  #base(guildId: string, guildBranchId: number, eventId: number): string {
    return `${this.#eventBase(guildId, guildBranchId, eventId)}/attributions`;
  }

  /** Returns the guild's attribution template for one scope ("General", or one specific boss) merged with this event's existing fills and seated characters. */
  getAttributions(guildId: string, guildBranchId: number, eventId: number, bossId: number | null): Observable<RaidEventAttributions> {
    return this.#http.get<RaidEventAttributions>(this.#base(guildId, guildBranchId, eventId), {
      params: bossId != null ? { bossId } : {},
    });
  }

  /** Returns every boss of the zone(s) this raid event targets — backs the Assignments page's boss navigation strip. */
  getBossesForEvent(guildId: string, guildBranchId: number, eventId: number): Observable<RaidBoss[]> {
    return this.#http.get<RaidBoss[]>(`${this.#eventBase(guildId, guildBranchId, eventId)}/bosses`);
  }

  setAttribution(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    bossId: number | null,
    definitionId: number,
    cellId: number,
    instanceIndex: number,
    characterId: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId, eventId)}/set`, { bossId, definitionId, cellId, instanceIndex, characterId });
  }

  clearAttribution(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    bossId: number | null,
    definitionId: number,
    cellId: number,
    instanceIndex: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId, eventId)}/clear`, { bossId, definitionId, cellId, instanceIndex });
  }
}
