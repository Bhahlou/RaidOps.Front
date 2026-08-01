import { Component, computed, inject, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { assignableCharactersFor, lockedCharacterEventIdsFor, playerAssignedCharacterIdsFor } from '../../utils/assignable-characters.util';
import { RaidSlotComponent } from '../raid-slot/raid-slot.component';

/** Groups x slots grid for a single active raid event — the only grid rendered at a time. */
@Component({
  selector: 'app-raid-event-grid',
  standalone: true,
  imports: [RaidSlotComponent, TranslocoPipe],
  templateUrl: './raid-event-grid.component.html',
  styleUrl: './raid-event-grid.component.scss',
})
export class RaidEventGridComponent {
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  readonly event = input.required<RaidEvent>();
  /** True for non-officer viewers — drag/drop and the unassign action are inert. */
  readonly disabled = input(false);
  /** Highlights the viewer's own characters (yellow outline) in the slot chips. */
  readonly currentUserDiscordId = input<string | null>(null);
  /** Full branch roster, to search over for the click-to-assign picker on empty slots. */
  readonly rosterMembers = input<GuildRosterMember[]>([]);
  /** Every event currently loaded (not just the visible ones) — used for the cross-event lockout-zone check. */
  readonly allEvents = input<RaidEvent[]>([]);

  readonly #store = inject(RaidBoardStore);
  readonly #snackbar = inject(SnackbarService);

  readonly groupNumbers = computed(() => range(1, this.event().groupCount));
  readonly slotNumbers = computed(() => range(1, this.event().slotsPerGroup));

  readonly assignableCharacters = computed(() => assignableCharactersFor(this.event(), this.rosterMembers(), this.allEvents()));
  /** Character ID → locking event IDs for this event, via a shared raid zone with another loaded event — drives the drag-blocking red highlight on every slot. */
  readonly lockedCharacterEventIds = computed(() => lockedCharacterEventIdsFor(this.event(), this.allEvents()));
  /** Player → already-seated character in this event — drives the drag-blocking red highlight for a player's second character. */
  readonly playerAssignedCharacterIds = computed(() => playerAssignedCharacterIdsFor(this.event()));

  assignmentFor(groupNumber: number, slotNumber: number): RaidSlotAssignment | null {
    return this.event().assignments.find((a) => a.groupNumber === groupNumber && a.slotNumber === slotNumber) ?? null;
  }

  slotDropListId(groupNumber: number, slotNumber: number): string {
    return `raid-slot-${this.event().id}-${groupNumber}-${slotNumber}`;
  }

  onDropped(item: RaidDragItem, groupNumber: number, slotNumber: number): void {
    if (this.disabled()) return;

    // A same-event drag landing on an occupied slot is a swap (raid-slot's canReceiveDrop only
    // lets that combination through) — everything else, including the dropped-on-self case
    // (dragging a chip back onto its own slot), is a plain assign, harmless no-op included.
    if (this.assignmentFor(groupNumber, slotNumber) && item.fromSlot?.eventId === this.event().id) {
      const { groupNumber: fromGroup, slotNumber: fromSlot } = item.fromSlot;
      this.#store.swapSlotAssignments(this.guildId(), this.guildBranchId(), this.event().id, fromGroup, fromSlot, groupNumber, slotNumber).subscribe({
        next: () => this.#store.reload(),
        error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
      });
      return;
    }

    // A drag arriving from another event that shares a lockout zone with this one only got past
    // raid-slot's isBlockedForDrag because it's being pulled straight out of the one event locking
    // it (see that computed's doc comment) — a cross-raid *move*, not a duplicate. Retract the
    // source assignment first so the character doesn't end up seated in both.
    const fromEventId = item.fromSlot?.eventId;
    if (fromEventId != null && fromEventId !== this.event().id && this.lockedCharacterEventIds().get(item.characterId)?.has(fromEventId)) {
      const { groupNumber: fromGroup, slotNumber: fromSlot } = item.fromSlot!;
      this.#store.unassignSlot(this.guildId(), this.guildBranchId(), fromEventId, fromGroup, fromSlot).subscribe({
        next: () => this.#assign(groupNumber, slotNumber, item.characterId),
        error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
      });
      return;
    }

    this.#assign(groupNumber, slotNumber, item.characterId);
  }

  #assign(groupNumber: number, slotNumber: number, characterId: number): void {
    this.#store.assignSlot(this.guildId(), this.guildBranchId(), this.event().id, groupNumber, slotNumber, characterId).subscribe({
      next: () => this.#store.reload(),
      error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
    });
  }

  onUnassign(groupNumber: number, slotNumber: number): void {
    if (this.disabled()) return;
    this.#store.unassignSlot(this.guildId(), this.guildBranchId(), this.event().id, groupNumber, slotNumber).subscribe({
      next: () => this.#store.reload(),
      error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
    });
  }

  onSpecChanged(specId: number, groupNumber: number, slotNumber: number): void {
    if (this.disabled()) return;
    this.#store.updateSlotSpec(this.guildId(), this.guildBranchId(), this.event().id, groupNumber, slotNumber, specId).subscribe({
      next: () => this.#store.reload(),
      error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
    });
  }
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
