import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';

export interface ConfirmUnlinkBnetDialogData {
  battleTag: string;
}

/** Confirmation dialog shown before unlinking a Battle.net account. */
@Component({
  selector: 'app-confirm-unlink-bnet-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './confirm-unlink-bnet-dialog.component.html',
  styleUrl: './confirm-unlink-bnet-dialog.component.scss',
})
export class ConfirmUnlinkBnetDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmUnlinkBnetDialogData>(DIALOG_DATA);

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
