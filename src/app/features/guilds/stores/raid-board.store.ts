import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidBoard, RaidEvent, RaidEventPayload } from '../models/raid-event.model';
import { GuildBranchLockoutWeek } from '../models/guild-branch-lockout-week.model';
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

  /**
   * Discord ID / character ID of whoever's currently being dragged (from the roster pool or an
   * occupied slot), or `null` when no drag is in progress — shared across every visible panel's
   * grid and the pool so a drop target can show itself as blocked (declared absent, or the
   * character already locked to this event's zones via another loaded event) before the drop is
   * attempted. `draggingFromSlot` is `null` for a roster-pool drag and set to the origin
   * event/group/slot for a drag starting on an occupied slot — it's what lets a target slot tell a
   * same-zone-lockout *move* (dragging a character straight out of the one event locking it) apart
   * from a genuine second-lockout conflict.
   */
  readonly draggingPlayerDiscordId = signal<string | null>(null);
  readonly draggingCharacterId = signal<number | null>(null);
  readonly draggingFromSlot = signal<{ eventId: number; groupNumber: number; slotNumber: number } | null>(null);

  startDrag(playerDiscordId: string, characterId: number, fromSlot: { eventId: number; groupNumber: number; slotNumber: number } | null = null): void {
    this.draggingPlayerDiscordId.set(playerDiscordId);
    this.draggingCharacterId.set(characterId);
    this.draggingFromSlot.set(fromSlot);
  }

  endDrag(): void {
    this.draggingPlayerDiscordId.set(null);
    this.draggingCharacterId.set(null);
    this.draggingFromSlot.set(null);
  }

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

  /** One-off fetch of the branch's current weekly lockout window — used to default the board's date range. */
  getLockoutWeek(guildId: string, guildBranchId: number): Observable<GuildBranchLockoutWeek> {
    return this.#service.getLockoutWeek(guildId, guildBranchId);
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

  swapSlotAssignments(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumberA: number,
    slotNumberA: number,
    groupNumberB: number,
    slotNumberB: number,
  ): Observable<void> {
    return this.#service.swapSlotAssignments(guildId, guildBranchId, eventId, groupNumberA, slotNumberA, groupNumberB, slotNumberB);
  }

  updateSlotSpec(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumber: number,
    slotNumber: number,
    specId: number,
  ): Observable<void> {
    return this.#service.updateSlotSpec(guildId, guildBranchId, eventId, groupNumber, slotNumber, specId);
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
