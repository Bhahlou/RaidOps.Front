import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';

/** Confirmation dialog shown before deactivating a character from RaidOps. */
@Component({
  selector: 'app-confirm-deactivate-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './confirm-deactivate-dialog.component.html',
  styleUrl: './confirm-deactivate-dialog.component.scss',
})
export class ConfirmDeactivateDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
