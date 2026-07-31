import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidZone } from '../models/raid-zone.model';
import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { RaidBoard, RaidEvent, RaidEventPayload, UnassignedMember } from '../models/raid-event.model';

/** Thin HTTP wrapper over every `api/v1/guilds/{guildId}/branches/{guildBranchId}/raids/...` endpoint. */
@Service()
export class RaidsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string, guildBranchId: number): string {
    return `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/raids`;
  }

  /** Returns the raid zones available for the branch's WoW game version, reference data. */
  getZones(guildId: string, guildBranchId: number): Observable<RaidZone[]> {
    return this.#http.get<RaidZone[]>(`${this.#base(guildId, guildBranchId)}/zones`);
  }

  /** Returns every raid series (active and inactive) configured for the guild branch. */
  getSeriesList(guildId: string, guildBranchId: number): Observable<RaidSeries[]> {
    return this.#http.get<RaidSeries[]>(`${this.#base(guildId, guildBranchId)}/series`);
  }

  createSeries(guildId: string, guildBranchId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/series`, payload);
  }

  updateSeries(guildId: string, guildBranchId: number, seriesId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/series/${seriesId}`, payload);
  }

  /** Stops a recurring series from generating any further occurrence — past events are untouched. */
  deactivateSeries(guildId: string, guildBranchId: number, seriesId: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/series/${seriesId}/deactivate`, {});
  }

  /** Idempotently materializes any due series occurrence within the range — call before loading the board. */
  materializeOccurrences(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/materialize`, null, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Fetches every raid event (with assignments and resolved member availability) within a date range. */
  getBoard(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): Observable<RaidBoard> {
    return this.#http.get<RaidBoard>(`${this.#base(guildId, guildBranchId)}/board`, {
      params: { rangeStart, rangeEnd },
    });
  }

  createEvent(guildId: string, guildBranchId: number, payload: RaidEventPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events`, payload);
  }

  updateEvent(guildId: string, guildBranchId: number, eventId: number, payload: RaidEventPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}`, payload);
  }

  /** Rejected server-side if the event still has assignments — use `cancelEvent` instead. */
  deleteEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}`);
  }

  cancelEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/cancel`, {});
  }

  /** Officer-only — makes a draft event visible to every roster member. One-way, no request body. */
  publish(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/publish`, {});
  }

  assignSlot(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumber: number,
    slotNumber: number,
    characterId: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/assign`, {
      groupNumber,
      slotNumber,
      characterId,
    });
  }

  unassignSlot(guildId: string, guildBranchId: number, eventId: number, groupNumber: number, slotNumber: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/unassign`, {
      groupNumber,
      slotNumber,
    });
  }

  /** Returns the guild members assigned to no raid event within the given date range. */
  getUnassignedMembers(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): Observable<UnassignedMember[]> {
    return this.#http.get<UnassignedMember[]>(`${this.#base(guildId, guildBranchId)}/unassigned-members`, {
      params: { rangeStart, rangeEnd },
    });
  }
}
