import { Component, computed, inject, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';
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

  readonly #store = inject(RaidBoardStore);
  readonly #snackbar = inject(SnackbarService);

  readonly groupNumbers = computed(() => range(1, this.event().groupCount));
  readonly slotNumbers = computed(() => range(1, this.event().slotsPerGroup));

  assignmentFor(groupNumber: number, slotNumber: number): RaidSlotAssignment | null {
    return this.event().assignments.find((a) => a.groupNumber === groupNumber && a.slotNumber === slotNumber) ?? null;
  }

  slotDropListId(groupNumber: number, slotNumber: number): string {
    return `raid-slot-${this.event().id}-${groupNumber}-${slotNumber}`;
  }

  onDropped(item: RaidDragItem, groupNumber: number, slotNumber: number): void {
    if (this.disabled()) return;
    // The dropped-on-self case (dragging a chip back onto its own slot) is a harmless no-op
    // re-assign server-side — not worth special-casing here.
    this.#store.assignSlot(this.guildId(), this.guildBranchId(), this.event().id, groupNumber, slotNumber, item.characterId).subscribe({
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
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
