import { Component, computed, input, output } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';

/**
 * A single group/slot coordinate of a raid event's grid — a `CdkDropList` accepting at most one
 * item (disabled as a drop target once occupied, so dropping onto an occupied slot is rejected
 * client-side too, matching the "no auto-swap" decision), and a `CdkDrag` around its own occupant
 * so an assigned character can be repositioned to another empty slot.
 */
@Component({
  selector: 'app-raid-slot',
  standalone: true,
  imports: [CdkDropList, CdkDrag, WowClassIconComponent, TranslocoPipe],
  templateUrl: './raid-slot.component.html',
  styleUrl: './raid-slot.component.scss',
})
export class RaidSlotComponent {
  readonly groupNumber = input.required<number>();
  readonly slotNumber = input.required<number>();
  readonly assignment = input<RaidSlotAssignment | null>(null);
  readonly dropListId = input.required<string>();
  /** True when drag/drop and the remove action should be inert (non-officer viewer). */
  readonly disabled = input(false);

  readonly dropped = output<RaidDragItem>();
  readonly unassign = output<void>();

  readonly Availability = DayAvailabilityStatus;

  /** A slot already holding someone can't accept another drop — no auto-swap, officer unassigns first. */
  readonly dropDisabled = computed(() => this.disabled() || this.assignment() !== null);

  dragItem(assignment: RaidSlotAssignment): RaidDragItem {
    return {
      characterId: assignment.characterId,
      characterName: assignment.characterName,
      classId: assignment.classId,
      classColor: assignment.classColor,
      fromSlot: { groupNumber: this.groupNumber(), slotNumber: this.slotNumber() },
    };
  }

  onDropped(event: CdkDragDrop<RaidSlotAssignment | null, unknown, RaidDragItem>): void {
    this.dropped.emit(event.item.data);
  }
}
