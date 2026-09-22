import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { RaidCompositionPreviewSlot } from '../../models/raid-composition-preview.model';
import { CompositionSpecDragItem } from '../../models/composition-spec-drag-item.model';

/**
 * A single group/slot coordinate of a preview's grid. Icon-only display — the spec icon already
 * identifies the placeholder, so its name is never rendered as text; the free-text note is shown
 * instead, colored by the placeholder's class when one is set. Accepts a drag from
 * `ClassSpecPaletteComponent` to set (or replace) the class/spec placeholder — dropping never
 * touches the note. Clicking the slot edits the note inline (no dialog) — Enter/blur commits,
 * Escape cancels. The small clear button (shown only once a class/spec is set) removes just the
 * placeholder, keeping the note.
 */
@Component({
  selector: 'app-composition-preview-slot',
  imports: [NgOptimizedImage, CdkDropList, WowClassIconComponent, TranslocoPipe],
  templateUrl: './composition-preview-slot.component.html',
  styleUrl: './composition-preview-slot.component.scss',
})
export class CompositionPreviewSlotComponent {
  readonly groupNumber = input.required<number>();
  readonly slotNumber = input.required<number>();
  readonly slot = input<RaidCompositionPreviewSlot | null>(null);

  readonly clear = output<void>();
  readonly dropped = output<CompositionSpecDragItem>();
  readonly noteChanged = output<string | null>();

  readonly editingNote = signal(false);
  readonly draftNote = signal('');

  private readonly noteInputRef = viewChild<ElementRef<HTMLInputElement>>('noteInput');

  onDropped(event: CdkDragDrop<RaidCompositionPreviewSlot | null, unknown, CompositionSpecDragItem>): void {
    this.dropped.emit(event.item.data);
  }

  startEditingNote(): void {
    this.draftNote.set(this.slot()?.note ?? '');
    this.editingNote.set(true);
    // Focus after the input actually renders — CdkMenu/CDK-overlay callers in this codebase use
    // the same setTimeout-after-flag-flip technique (see raid-slot's onAssignMenuOpened).
    setTimeout(() => this.noteInputRef()?.nativeElement.focus());
  }

  commitNote(): void {
    if (!this.editingNote()) return;
    this.editingNote.set(false);

    const trimmed = this.draftNote().trim();
    if (trimmed === (this.slot()?.note ?? '')) return;
    this.noteChanged.emit(trimmed || null);
  }

  cancelEditingNote(): void {
    this.editingNote.set(false);
  }
}
