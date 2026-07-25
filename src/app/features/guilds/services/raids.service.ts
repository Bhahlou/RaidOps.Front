import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidZone } from '../models/raid-zone.model';
import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { RaidBoard, RaidEvent, RaidEventPayload, UnassignedMember } from '../models/raid-event.model';

/** Thin HTTP wrapper over every `api/v1/guilds/{guildId}/raids/...` endpoint. */
@Service()
export class RaidsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Returns the raid zones available for a branch (game version), reference data. */
  getZones(guildId: string, branchId: number): Observable<RaidZone[]> {
    return this.#http.get<RaidZone[]>(`${this.#api}/guilds/${guildId}/raids/zones`, {
      params: { branchId },
    });
  }

  /** Returns every raid series (active and inactive) configured for the guild. */
  getSeriesList(guildId: string): Observable<RaidSeries[]> {
    return this.#http.get<RaidSeries[]>(`${this.#api}/guilds/${guildId}/raids/series`);
  }

  createSeries(guildId: string, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/series`, payload);
  }

  updateSeries(guildId: string, seriesId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/raids/series/${seriesId}`, payload);
  }

  /** Stops a recurring series from generating any further occurrence — past events are untouched. */
  deactivateSeries(guildId: string, seriesId: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/series/${seriesId}/deactivate`, {});
  }

  /** Idempotently materializes any due series occurrence within the range — call before loading the board. */
  materializeOccurrences(guildId: string, rangeStart: string, rangeEnd: string): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/materialize`, null, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Fetches every raid event (with assignments and resolved member availability) within a date range. */
  getBoard(guildId: string, rangeStart: string, rangeEnd: string): Observable<RaidBoard> {
    return this.#http.get<RaidBoard>(`${this.#api}/guilds/${guildId}/raids/board`, {
      params: { rangeStart, rangeEnd },
    });
  }

  createEvent(guildId: string, payload: RaidEventPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/events`, payload);
  }

  updateEvent(guildId: string, eventId: number, payload: RaidEventPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}`, payload);
  }

  /** Rejected server-side if the event still has assignments — use `cancelEvent` instead. */
  deleteEvent(guildId: string, eventId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}`);
  }

  cancelEvent(guildId: string, eventId: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}/cancel`, {});
  }

  /** Officer-only — makes a draft event visible to every roster member. One-way, no request body. */
  publish(guildId: string, eventId: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}/publish`, {});
  }

  assignSlot(guildId: string, eventId: number, groupNumber: number, slotNumber: number, characterId: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}/slots/assign`, {
      groupNumber,
      slotNumber,
      characterId,
    });
  }

  unassignSlot(guildId: string, eventId: number, groupNumber: number, slotNumber: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/raids/events/${eventId}/slots/unassign`, {
      groupNumber,
      slotNumber,
    });
  }

  /** Returns the guild members assigned to no raid event within the given date range. */
  getUnassignedMembers(guildId: string, rangeStart: string, rangeEnd: string): Observable<UnassignedMember[]> {
    return this.#http.get<UnassignedMember[]>(`${this.#api}/guilds/${guildId}/raids/unassigned-members`, {
      params: { rangeStart, rangeEnd },
    });
  }
}
