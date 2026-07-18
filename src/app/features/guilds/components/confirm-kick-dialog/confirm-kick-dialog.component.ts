import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';

export interface ConfirmKickDialogData {
  characterName: string;
}

/** Confirmation dialog shown before an officer ejects a character from the guild roster. */
@Component({
  selector: 'app-confirm-kick-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './confirm-kick-dialog.component.html',
  styleUrl: './confirm-kick-dialog.component.scss',
})
export class ConfirmKickDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmKickDialogData>(DIALOG_DATA);

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
