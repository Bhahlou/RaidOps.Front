import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  RecurringAvailabilityPatternPayload,
} from '../models/availability.model';

@Service()
export class AvailabilityService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the requesting member's resolved availability calendar over a date range for a guild. */
  getMyAvailability(guildId: string, rangeStart: string, rangeEnd: string): Observable<AvailabilityCalendar> {
    return this.#http.get<AvailabilityCalendar>(`${this.#api}/guilds/${guildId}/availability`, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Declares a one-off availability exception for a single date or date range. */
  createException(guildId: string, payload: CreateAvailabilityExceptionPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/availability/exceptions`, payload);
  }

  /** Deletes one of the requesting member's own one-off availability exceptions. */
  deleteException(guildId: string, exceptionId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/guilds/${guildId}/availability/exceptions/${exceptionId}`);
  }

  /** Creates a recurring availability pattern. */
  createPattern(guildId: string, payload: RecurringAvailabilityPatternPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/availability/patterns`, payload);
  }

  /** Replaces the settings and full day set of one of the requesting member's own recurring patterns. */
  updatePattern(guildId: string, patternId: number, payload: RecurringAvailabilityPatternPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/availability/patterns/${patternId}`, payload);
  }

  /** Deletes one of the requesting member's own recurring availability patterns. */
  deletePattern(guildId: string, patternId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/guilds/${guildId}/availability/patterns/${patternId}`);
  }
}
