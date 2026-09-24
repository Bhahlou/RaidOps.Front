import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';

export interface CreatePreviewDialogData {
  guildId: string;
  guildBranchId: number;
}

/** Create dialog for a new raid composition preview — name + group count (1-8), both fixed once created. */
@Component({
  selector: 'app-create-preview-dialog',
  imports: [TranslocoPipe, ButtonComponent, FormFieldCardComponent],
  templateUrl: './create-preview-dialog.component.html',
  styleUrl: './create-preview-dialog.component.scss',
})
export class CreatePreviewDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #store = inject(RaidCompositionPreviewsStore);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<CreatePreviewDialogData>(DIALOG_DATA);

  readonly name = signal('');
  readonly groupCount = signal(8);
  readonly submitting = signal(false);

  readonly canSubmit = computed(
    () => !this.submitting() && this.name().trim().length > 0 && this.groupCount() >= 1 && this.groupCount() <= 8,
  );

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.#store.createPreview(this.data.guildId, this.data.guildBranchId, { name: this.name().trim(), groupCount: this.groupCount() }).subscribe({
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
