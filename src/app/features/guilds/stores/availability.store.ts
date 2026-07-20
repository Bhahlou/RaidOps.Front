import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  RecurringAvailabilityPatternPayload,
} from '../models/availability.model';
import { AvailabilityService } from '../services/availability.service';

interface RangeKey {
  guildId: string;
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
    return `${environment.apiUrl}/guilds/${key.guildId}/availability?rangeStart=${key.rangeStart}&rangeEnd=${key.rangeEnd}`;
  });

  readonly calendar = computed(() => this.#calendarResource.value() ?? null);
  readonly isLoading = this.#calendarResource.isLoading;

  /**
   * Points the store at a guild's availability calendar over a date range and forces a fresh
   * fetch — declarations can be edited between visits, so cached data can't be trusted on its own.
   */
  loadRange(guildId: string, rangeStart: string, rangeEnd: string): void {
    const next: RangeKey = { guildId, rangeStart, rangeEnd };
    const current = this.#key();
    if (current && sameRange(current, next)) {
      this.#calendarResource.reload();
    } else {
      this.#key.set(next);
    }
  }

  /** Re-fetches the current range without changing which guild/range is tracked. */
  reload(): void {
    this.#calendarResource.reload();
  }

  createException(guildId: string, payload: CreateAvailabilityExceptionPayload): Observable<void> {
    return this.#service.createException(guildId, payload);
  }

  deleteException(guildId: string, exceptionId: number): Observable<void> {
    return this.#service.deleteException(guildId, exceptionId);
  }

  createPattern(guildId: string, payload: RecurringAvailabilityPatternPayload): Observable<void> {
    return this.#service.createPattern(guildId, payload);
  }

  updatePattern(guildId: string, patternId: number, payload: RecurringAvailabilityPatternPayload): Observable<void> {
    return this.#service.updatePattern(guildId, patternId, payload);
  }

  deletePattern(guildId: string, patternId: number): Observable<void> {
    return this.#service.deletePattern(guildId, patternId);
  }
}

function sameRange(a: RangeKey, b: RangeKey): boolean {
  return a.guildId === b.guildId && a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}
