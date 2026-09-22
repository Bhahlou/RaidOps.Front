import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { map } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';

export interface RenamePreviewDialogData {
  guildId: string;
  guildBranchId: number;
  previewId: number;
  mode: 'rename' | 'duplicate';
  /** Prefilled name — the current name for rename, "{name} (copy)" for duplicate. */
  initialName: string;
}

/**
 * Single-field dialog covering both renaming a preview and duplicating it under a new name — the
 * two only differ in title/submit label and which store call they make, never both at once.
 */
@Component({
  selector: 'app-rename-preview-dialog',
  imports: [TranslocoPipe, ButtonComponent, FormFieldCardComponent],
  templateUrl: './rename-preview-dialog.component.html',
  styleUrl: './rename-preview-dialog.component.scss',
})
export class RenamePreviewDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #store = inject(RaidCompositionPreviewsStore);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<RenamePreviewDialogData>(DIALOG_DATA);

  readonly isDuplicate = this.data.mode === 'duplicate';
  readonly name = signal(this.data.initialName);
  readonly submitting = signal(false);

  readonly canSubmit = () => !this.submitting() && this.name().trim().length > 0;

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    const trimmed = this.name().trim();

    const request = this.isDuplicate
      ? this.#store.duplicatePreview(this.data.guildId, this.data.guildBranchId, this.data.previewId, trimmed).pipe(map(() => undefined))
      : this.#store.renamePreview(this.data.guildId, this.data.guildBranchId, this.data.previewId, trimmed);

    request.subscribe({
      next: () => this.#dialogRef.close(true),
      error: () => {
        this.submitting.set(false);
        this.#snackbar.error('errors.server');
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
