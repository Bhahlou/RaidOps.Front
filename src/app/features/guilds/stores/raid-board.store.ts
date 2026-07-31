import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidBoard, RaidEvent, RaidEventPayload } from '../models/raid-event.model';
import { RaidsService } from '../services/raids.service';

interface RangeKey {
  guildId: string;
  guildBranchId: number;
  rangeStart: string;
  rangeEnd: string;
}

/**
 * The raid board (materialized events + assignments + resolved member availability) for a guild
 * branch over a date range. Materialization has no scheduled job (no Hangfire/Quartz in this
 * codebase), so `loadRange` always fires the idempotent materialize command first, then
 * loads/reloads the board — same "reload if same key, else set new key" branching as
 * `AvailabilityStore.loadRange`.
 */
@Service()
export class RaidBoardStore {
  readonly #service = inject(RaidsService);

  readonly #key = signal<RangeKey | null>(null);
  readonly #materializing = signal(false);

  readonly #boardResource = httpResource<RaidBoard>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/raids/board?rangeStart=${key.rangeStart}&rangeEnd=${key.rangeEnd}`;
  });

  readonly events = computed<RaidEvent[]>(() => this.#boardResource.value()?.events ?? []);
  readonly isLoading = computed(() => this.#materializing() || this.#boardResource.isLoading());

  /** Materializes any due series occurrence in the range, then points the board at it (forcing a fresh fetch). */
  loadRange(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): void {
    const next: RangeKey = { guildId, guildBranchId, rangeStart, rangeEnd };
    this.#materializing.set(true);
    this.#service.materializeOccurrences(guildId, guildBranchId, rangeStart, rangeEnd).subscribe({
      // Materialization failing (e.g. transient network blip) shouldn't strand the board on a
      // stale range — still load whatever already exists server-side for that window.
      next: () => this.#applyKey(next),
      error: () => this.#applyKey(next),
    });
  }

  /** Re-fetches the current range without changing which guild branch/range is tracked, and without re-materializing. */
  reload(): void {
    this.#boardResource.reload();
  }

  createEvent(guildId: string, guildBranchId: number, payload: RaidEventPayload): Observable<void> {
    return this.#service.createEvent(guildId, guildBranchId, payload);
  }

  updateEvent(guildId: string, guildBranchId: number, eventId: number, payload: RaidEventPayload): Observable<void> {
    return this.#service.updateEvent(guildId, guildBranchId, eventId, payload);
  }

  deleteEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#service.deleteEvent(guildId, guildBranchId, eventId);
  }

  cancelEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#service.cancelEvent(guildId, guildBranchId, eventId);
  }

  publishEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#service.publish(guildId, guildBranchId, eventId);
  }

  assignSlot(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumber: number,
    slotNumber: number,
    characterId: number,
  ): Observable<void> {
    return this.#service.assignSlot(guildId, guildBranchId, eventId, groupNumber, slotNumber, characterId);
  }

  unassignSlot(guildId: string, guildBranchId: number, eventId: number, groupNumber: number, slotNumber: number): Observable<void> {
    return this.#service.unassignSlot(guildId, guildBranchId, eventId, groupNumber, slotNumber);
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
  return a.guildId === b.guildId && a.guildBranchId === b.guildBranchId && a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}
