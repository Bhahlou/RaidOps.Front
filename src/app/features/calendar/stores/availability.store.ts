import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  CreateRecurringAvailabilityPatternPayload,
  UpdateAvailabilityExceptionPayload,
  UpdateRecurringAvailabilityPatternPayload,
} from '../models/availability.model';
import { AvailabilityService } from '../services/availability.service';

interface RangeKey {
  rangeStart: string;
  rangeEnd: string;
}

@Service()
export class AvailabilityStore {
  readonly #service = inject(AvailabilityService);

  readonly #key = signal<RangeKey | null>(null);

  readonly #calendarResource = httpResource<AvailabilityCalendar>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/me/availability?rangeStart=${key.rangeStart}&rangeEnd=${key.rangeEnd}`;
  });

  readonly calendar = computed(() => this.#calendarResource.value() ?? null);
  readonly isLoading = this.#calendarResource.isLoading;

  /**
   * Points the store at the requesting member's availability overview over a date range and
   * forces a fresh fetch — declarations can be edited between visits, so cached data can't be
   * trusted on its own.
   */
  loadRange(rangeStart: string, rangeEnd: string): void {
    const next: RangeKey = { rangeStart, rangeEnd };
    const current = this.#key();
    if (current && sameRange(current, next)) {
      this.#calendarResource.reload();
    } else {
      this.#key.set(next);
    }
  }

  /** Re-fetches the current range without changing which range is tracked. */
  reload(): void {
    this.#calendarResource.reload();
  }

  createException(payload: CreateAvailabilityExceptionPayload): Observable<void> {
    return this.#service.createException(payload);
  }

  deleteException(exceptionId: number): Observable<void> {
    return this.#service.deleteException(exceptionId);
  }

  updateException(exceptionId: number, payload: UpdateAvailabilityExceptionPayload): Observable<void> {
    return this.#service.updateException(exceptionId, payload);
  }

  removeExceptionDay(exceptionId: number, date: string): Observable<void> {
    return this.#service.removeExceptionDay(exceptionId, date);
  }

  createPattern(payload: CreateRecurringAvailabilityPatternPayload): Observable<void> {
    return this.#service.createPattern(payload);
  }

  updatePattern(patternId: number, payload: UpdateRecurringAvailabilityPatternPayload): Observable<void> {
    return this.#service.updatePattern(patternId, payload);
  }

  deletePattern(patternId: number): Observable<void> {
    return this.#service.deletePattern(patternId);
  }
}

function sameRange(a: RangeKey, b: RangeKey): boolean {
  return a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}
