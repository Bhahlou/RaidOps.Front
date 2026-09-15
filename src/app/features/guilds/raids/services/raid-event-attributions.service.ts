import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RaidEventAttributions } from '../models/raid-event-attributions.model';

/** Thin HTTP wrapper over a raid event's Assignments tab endpoints. */
@Service()
export class RaidEventAttributionsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string, guildBranchId: number, eventId: number): string {
    return `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/raids/events/${eventId}/attributions`;
  }

  /** Returns the guild's attribution template merged with this event's existing fills and seated characters. */
  getAttributions(guildId: string, guildBranchId: number, eventId: number): Observable<RaidEventAttributions> {
    return this.#http.get<RaidEventAttributions>(this.#base(guildId, guildBranchId, eventId));
  }

  setAttribution(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    definitionId: number,
    cellId: number,
    instanceIndex: number,
    characterId: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId, eventId)}/set`, { definitionId, cellId, instanceIndex, characterId });
  }

  clearAttribution(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    definitionId: number,
    cellId: number,
    instanceIndex: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId, eventId)}/clear`, { definitionId, cellId, instanceIndex });
  }
}
