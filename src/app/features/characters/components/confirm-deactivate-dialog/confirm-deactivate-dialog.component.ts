import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslocoPipe } from '@jsverse/transloco';

/** Confirmation dialog shown before deactivating a character from RaidOps. */
@Component({
  selector: 'app-confirm-deactivate-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslocoPipe],
  templateUrl: './confirm-deactivate-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirm-deactivate-dialog.component.scss',
})
export class ConfirmDeactivateDialogComponent {
  readonly #dialogRef = inject(MatDialogRef<ConfirmDeactivateDialogComponent>);

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
