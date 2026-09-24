import { Component, computed, inject, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { RaidCompositionPreview, RaidCompositionPreviewSlot } from '../../models/raid-composition-preview.model';
import { CompositionSpecDragItem } from '../../models/composition-spec-drag-item.model';
import { compositionPreviewErrorKey } from '../../utils/composition-preview-error-key.util';
import { CompositionPreviewSlotComponent } from '../composition-preview-slot/composition-preview-slot.component';

/**
 * Groups x slots grid for a raid composition preview. Dropping a spec (dragged from
 * `ClassSpecPaletteComponent`) sets a slot's class/spec placeholder without touching its note;
 * the small clear button removes just the placeholder, keeping the note. The note itself is
 * edited directly inline on the slot (see `CompositionPreviewSlotComponent`), no dialog involved.
 */
@Component({
  selector: 'app-composition-preview-grid',
  imports: [CompositionPreviewSlotComponent, TranslocoPipe],
  templateUrl: './composition-preview-grid.component.html',
  styleUrl: './composition-preview-grid.component.scss',
})
export class CompositionPreviewGridComponent {
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  readonly preview = input.required<RaidCompositionPreview>();

  readonly #store = inject(RaidCompositionPreviewsStore);
  readonly #snackbar = inject(SnackbarService);

  readonly groupNumbers = computed(() => range(1, this.preview().groupCount));
  readonly slotNumbers = computed(() => range(1, this.preview().slotsPerGroup));

  slotFor(groupNumber: number, slotNumber: number): RaidCompositionPreviewSlot | null {
    return this.preview().slots.find((s) => s.groupNumber === groupNumber && s.slotNumber === slotNumber) ?? null;
  }

  onDropped(item: CompositionSpecDragItem, groupNumber: number, slotNumber: number): void {
    const existingNote = this.slotFor(groupNumber, slotNumber)?.note ?? null;
    this.#updateSlot(groupNumber, slotNumber, item.wowClassId, item.specId, existingNote);
  }

  onClear(groupNumber: number, slotNumber: number): void {
    const existingNote = this.slotFor(groupNumber, slotNumber)?.note ?? null;
    this.#updateSlot(groupNumber, slotNumber, null, null, existingNote);
  }

  onNoteChanged(note: string | null, groupNumber: number, slotNumber: number): void {
    const existing = this.slotFor(groupNumber, slotNumber);
    this.#updateSlot(groupNumber, slotNumber, existing?.wowClassId ?? null, existing?.specId ?? null, note);
  }

  #updateSlot(groupNumber: number, slotNumber: number, wowClassId: number | null, specId: number | null, note: string | null): void {
    this.#store.updateSlot(this.guildId(), this.guildBranchId(), this.preview().id, { groupNumber, slotNumber, wowClassId, specId, note }).subscribe({
      next: () => this.#store.reload(),
      error: (err: HttpErrorResponse) => this.#snackbar.error(compositionPreviewErrorKey(err)),
    });
  }
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}
