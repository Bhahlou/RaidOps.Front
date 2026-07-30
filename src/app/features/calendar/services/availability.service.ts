import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  CreateRecurringAvailabilityPatternPayload,
  UpdateAvailabilityExceptionPayload,
  UpdateRecurringAvailabilityPatternPayload,
} from '../models/availability.model';

@Service()
export class AvailabilityService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the requesting member's resolved availability overview over a date range, across every scope. */
  getMyAvailability(rangeStart: string, rangeEnd: string): Observable<AvailabilityCalendar> {
    return this.#http.get<AvailabilityCalendar>(`${this.#api}/me/availability`, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Declares a one-off availability exception for a single date or date range, either Global or scoped to a branch. */
  createException(payload: CreateAvailabilityExceptionPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/me/availability/exceptions`, payload);
  }

  /** Deletes one of the requesting member's own one-off availability exceptions. */
  deleteException(exceptionId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/me/availability/exceptions/${exceptionId}`);
  }

  /** Replaces the dates/status of one of the requesting member's own one-off availability exceptions. */
  updateException(exceptionId: number, payload: UpdateAvailabilityExceptionPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/me/availability/exceptions/${exceptionId}`, payload);
  }

  /**
   * Clears a single day out of one of the requesting member's own one-off availability
   * exceptions — the back end shrinks or splits the declaration as needed.
   */
  removeExceptionDay(exceptionId: number, date: string): Observable<void> {
    return this.#http.post<void>(`${this.#api}/me/availability/exceptions/${exceptionId}/remove-day`, { date });
  }

  /** Creates a recurring availability pattern, either Global or scoped to a branch. */
  createPattern(payload: CreateRecurringAvailabilityPatternPayload): Observable<void> {
    return this.#http.post<void>(`${this.#api}/me/availability/patterns`, payload);
  }

  /** Replaces the settings and full day set of one of the requesting member's own recurring patterns. */
  updatePattern(patternId: number, payload: UpdateRecurringAvailabilityPatternPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/me/availability/patterns/${patternId}`, payload);
  }

  /** Deletes one of the requesting member's own recurring availability patterns. */
  deletePattern(patternId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/me/availability/patterns/${patternId}`);
  }
}
