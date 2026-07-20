import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent, ButtonVariant } from '../../buttons/button/button.component';

export interface ConfirmDialogData {
  /** i18n key for the dialog's title. */
  title: string;
  /** i18n key for the dialog's body text. */
  message: string;
  /** Interpolation params for `message`, if it has placeholders. */
  messageParams?: Record<string, string | number>;
  /** i18n key for the confirm button. Defaults to a generic "Confirm". */
  confirmLabel?: string;
  /** i18n key for the cancel button. Defaults to a generic "Cancel". */
  cancelLabel?: string;
  /** Styles the confirm button as destructive. Defaults to `true` — most confirmations guard a destructive action. */
  danger?: boolean;
}

/** Generic yes/no confirmation dialog for actions worth a second thought (e.g. deleting a recurring pattern). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  readonly confirmVariant: ButtonVariant = this.data.danger === false ? 'primary' : 'danger';

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
