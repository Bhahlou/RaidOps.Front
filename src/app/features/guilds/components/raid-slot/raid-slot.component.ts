import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { AssignableCharacter, LockedCharacterEventIds } from '../../utils/assignable-characters.util';

/**
 * A single group/slot coordinate of a raid event's grid — a `CdkDropList` accepting at most one
 * item, and a `CdkDrag` around its own occupant so an assigned character can be repositioned to
 * another empty slot, or swapped with another occupied slot of the *same* event (see
 * `canReceiveDrop`). A drop from the roster pool, or from an occupied slot in a different event,
 * is still rejected once this slot is occupied — only a same-event slot-to-slot drag may land here.
 */
@Component({
  selector: 'app-raid-slot',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkMenu, CdkMenuItem, CdkMenuTrigger, NgOptimizedImage, WowClassIconComponent, TranslocoPipe],
  templateUrl: './raid-slot.component.html',
  styleUrl: './raid-slot.component.scss',
})
export class RaidSlotComponent {
  /** ID of the event this slot belongs to — stamped onto outgoing drag data so a same-event swap can be told apart from a cross-event drag. */
  readonly eventId = input.required<number>();
  readonly groupNumber = input.required<number>();
  readonly slotNumber = input.required<number>();
  readonly assignment = input<RaidSlotAssignment | null>(null);
  readonly dropListId = input.required<string>();
  /** Discord IDs of roster players currently ineligible for this slot's event — see `RaidEvent.ineligiblePlayerDiscordIds`. */
  readonly ineligiblePlayerDiscordIds = input<string[]>([]);
  /** Character ID → locking event IDs for this slot's event, via a shared raid zone with another loaded event. */
  readonly lockedCharacterEventIds = input<LockedCharacterEventIds>(new Map());
  /** Player → already-seated character in this slot's event — see `isBlockedForDrag`. */
  readonly playerAssignedCharacterIds = input<ReadonlyMap<string, number>>(new Map());
  /** True when drag/drop and the remove action should be inert (non-officer viewer). */
  readonly disabled = input(false);
  /** Highlights this slot's chip (yellow outline) when it's one of the viewer's own characters. */
  readonly currentUserDiscordId = input<string | null>(null);
  /** Characters eligible for the click-to-assign search picker on this slot when it's empty. */
  readonly assignableCharacters = input<AssignableCharacter[]>([]);

  readonly dropped = output<RaidDragItem>();
  readonly unassign = output<void>();
  readonly specChanged = output<number>();

  readonly #boardStore = inject(RaidBoardStore);

  readonly Availability = DayAvailabilityStatus;

  private readonly assignSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('assignSearchInput');

  /**
   * True while a drag is in progress for a player declared absent on this slot's event, for a
   * character already locked to this slot's event via a shared raid zone with another loaded
   * event, or for a player who already holds a *different* character's slot in this event (one
   * character per player per event) — all three are hard rejects server-side, shown red and inert
   * before the drop is attempted. The player check is keyed on character, not just player, so
   * repositioning a player's own already-seated character to another slot of the same event isn't
   * mistaken for the second-character conflict it's meant to catch. The lockout check has a
   * similar exception: dragging a character straight out of the *one* event that's locking it (a
   * cross-raid move between two events sharing a zone) clears the lock instead of blocking — see
   * `RaidEventGridComponent.onDropped`, which retracts the source assignment for that exact case.
   */
  readonly isBlockedForDrag = computed(() => {
    const draggingPlayerId = this.#boardStore.draggingPlayerDiscordId();
    if (draggingPlayerId != null && this.ineligiblePlayerDiscordIds().includes(draggingPlayerId)) return true;

    const draggingCharacterId = this.#boardStore.draggingCharacterId();
    if (draggingCharacterId != null) {
      const lockingEventIds = this.lockedCharacterEventIds().get(draggingCharacterId);
      if (lockingEventIds && lockingEventIds.size > 0) {
        const fromSlot = this.#boardStore.draggingFromSlot();
        const isMoveOutOfTheOnlyLockingEvent = fromSlot != null && lockingEventIds.size === 1 && lockingEventIds.has(fromSlot.eventId);
        if (!isMoveOutOfTheOnlyLockingEvent) return true;
      }
    }

    if (draggingPlayerId != null) {
      const seatedCharacterId = this.playerAssignedCharacterIds().get(draggingPlayerId);
      if (seatedCharacterId != null && seatedCharacterId !== draggingCharacterId) return true;
    }

    return false;
  });

  /**
   * `cdkDropListDisabled` cascades to `DragRef.disabled` for whatever's currently sitting inside
   * it (CDK checks the *origin* container's disabled state before allowing a drag to start) — so
   * this must stay scoped to "inert for this viewer" only. It must NOT also cover "already
   * occupied" or "blocked for the dragged player", or repositioning/swapping an occupant would
   * silently stop working. Kept for the CSS hook (`cdk-drop-list-disabled`) and to stop
   * non-officers dragging anything at all.
   */
  readonly dropDisabled = computed(() => this.disabled());

  /**
   * The real gate for accepting an incoming drop — `cdkDropListDisabled` alone doesn't actually
   * block drop acceptance in Angular CDK (verified in the CDK source: only `enterPredicate` and a
   * DOM hit-test are checked), so this is what must mirror the actual business rule: inert for
   * this viewer, or the dragged player is declared absent for this slot's event, always reject.
   * An empty slot accepts anything past that. An occupied slot additionally requires the drag to
   * have started from another occupied slot of *this same event* — that's a swap, routed to
   * `SwapSlotAssignmentsCommand` by the grid's drop handler; a pool character or a slot from a
   * different event can't land here.
   */
  readonly canReceiveDrop = (drag: CdkDrag<RaidDragItem>): boolean => {
    if (this.disabled() || this.isBlockedForDrag()) return false;
    if (this.assignment() === null) return true;

    const from = drag.data?.fromSlot;
    if (from == null) return false;
    if (from.eventId !== this.eventId()) return false;
    return from.groupNumber !== this.groupNumber() || from.slotNumber !== this.slotNumber();
  };

  /** Spec switching only makes sense if the officer can act and the character has more than one declared raid spec. */
  canChangeSpec(assignment: RaidSlotAssignment): boolean {
    return !this.disabled() && assignment.availableSpecs.length > 1;
  }

  isOwnCharacter(assignment: RaidSlotAssignment): boolean {
    const currentUserId = this.currentUserDiscordId();
    return currentUserId != null && assignment.playerDiscordId === currentUserId;
  }

  onSpecSelected(specId: number): void {
    this.specChanged.emit(specId);
  }

  /** Narrows `assignableCharacters` in the click-to-assign picker — cleared each time it's reopened. */
  readonly assignQuery = signal('');

  readonly filteredAssignableCharacters = computed(() => {
    const q = this.assignQuery().trim().toLowerCase();
    const list = this.assignableCharacters();
    return q ? list.filter((c) => c.characterName.toLowerCase().includes(q)) : list;
  });

  /**
   * Focus is grabbed via a macrotask, not synchronously here — CdkMenuTrigger's own click handler
   * focuses the first `cdkMenuItem` right after this fires, and a `setTimeout` is guaranteed to
   * run after that synchronous call, letting our focus win instead of its.
   */
  onAssignMenuOpened(): void {
    this.assignQuery.set('');
    setTimeout(() => this.assignSearchInputRef()?.nativeElement.focus());
  }

  onCharacterPicked(character: AssignableCharacter): void {
    this.dropped.emit({
      characterId: character.characterId,
      characterName: character.characterName,
      classId: character.classId,
      classColor: character.classColor,
      playerDiscordId: character.playerDiscordId,
    });
  }

  dragItem(assignment: RaidSlotAssignment): RaidDragItem {
    return {
      characterId: assignment.characterId,
      characterName: assignment.characterName,
      classId: assignment.classId,
      classColor: assignment.classColor,
      playerDiscordId: assignment.playerDiscordId,
      fromSlot: { eventId: this.eventId(), groupNumber: this.groupNumber(), slotNumber: this.slotNumber() },
    };
  }

  onDropped(event: CdkDragDrop<RaidSlotAssignment | null, unknown, RaidDragItem>): void {
    this.dropped.emit(event.item.data);
  }

  onDragStarted(assignment: RaidSlotAssignment): void {
    this.#boardStore.startDrag(assignment.playerDiscordId, assignment.characterId, {
      eventId: this.eventId(),
      groupNumber: this.groupNumber(),
      slotNumber: this.slotNumber(),
    });
  }

  onDragEnded(): void {
    this.#boardStore.endDrag();
  }
}
