import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidBoard, RaidEvent, RaidEventPayload } from '../models/raid-event.model';
import { RaidsService } from '../services/raids.service';

interface RangeKey {
  guildId: string;
  rangeStart: string;
  rangeEnd: string;
}

/**
 * The raid board (materialized events + assignments + resolved member availability) for a guild
 * over a date range. Materialization has no scheduled job (no Hangfire/Quartz in this codebase),
 * so `loadRange` always fires the idempotent materialize command first, then loads/reloads the
 * board — same "reload if same key, else set new key" branching as `AvailabilityStore.loadRange`.
 */
@Service()
export class RaidBoardStore {
  readonly #service = inject(RaidsService);

  readonly #key = signal<RangeKey | null>(null);
  readonly #materializing = signal(false);

  readonly #boardResource = httpResource<RaidBoard>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/raids/board?rangeStart=${key.rangeStart}&rangeEnd=${key.rangeEnd}`;
  });

  readonly events = computed<RaidEvent[]>(() => this.#boardResource.value()?.events ?? []);
  readonly isLoading = computed(() => this.#materializing() || this.#boardResource.isLoading());

  /** Materializes any due series occurrence in the range, then points the board at it (forcing a fresh fetch). */
  loadRange(guildId: string, rangeStart: string, rangeEnd: string): void {
    const next: RangeKey = { guildId, rangeStart, rangeEnd };
    this.#materializing.set(true);
    this.#service.materializeOccurrences(guildId, rangeStart, rangeEnd).subscribe({
      // Materialization failing (e.g. transient network blip) shouldn't strand the board on a
      // stale range — still load whatever already exists server-side for that window.
      next: () => this.#applyKey(next),
      error: () => this.#applyKey(next),
    });
  }

  /** Re-fetches the current range without changing which guild/range is tracked, and without re-materializing. */
  reload(): void {
    this.#boardResource.reload();
  }

  createEvent(guildId: string, payload: RaidEventPayload): Observable<void> {
    return this.#service.createEvent(guildId, payload);
  }

  updateEvent(guildId: string, eventId: number, payload: RaidEventPayload): Observable<void> {
    return this.#service.updateEvent(guildId, eventId, payload);
  }

  deleteEvent(guildId: string, eventId: number): Observable<void> {
    return this.#service.deleteEvent(guildId, eventId);
  }

  cancelEvent(guildId: string, eventId: number): Observable<void> {
    return this.#service.cancelEvent(guildId, eventId);
  }

  publishEvent(guildId: string, eventId: number): Observable<void> {
    return this.#service.publish(guildId, eventId);
  }

  assignSlot(guildId: string, eventId: number, groupNumber: number, slotNumber: number, characterId: number): Observable<void> {
    return this.#service.assignSlot(guildId, eventId, groupNumber, slotNumber, characterId);
  }

  unassignSlot(guildId: string, eventId: number, groupNumber: number, slotNumber: number): Observable<void> {
    return this.#service.unassignSlot(guildId, eventId, groupNumber, slotNumber);
  }

  #applyKey(next: RangeKey): void {
    this.#materializing.set(false);
    const current = this.#key();
    if (current && sameRange(current, next)) {
      this.#boardResource.reload();
    } else {
      this.#key.set(next);
    }
  }
}

function sameRange(a: RangeKey, b: RangeKey): boolean {
  return a.guildId === b.guildId && a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}
