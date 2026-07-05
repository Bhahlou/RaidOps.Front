import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslocoPipe } from '@jsverse/transloco';

export interface ConfirmKickDialogData {
  characterName: string;
}

/** Confirmation dialog shown before an officer ejects a character from the guild roster. */
@Component({
  selector: 'app-confirm-kick-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslocoPipe],
  templateUrl: './confirm-kick-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './confirm-kick-dialog.component.scss',
})
export class ConfirmKickDialogComponent {
  readonly #dialogRef = inject(MatDialogRef<ConfirmKickDialogComponent>);
  readonly data = inject<ConfirmKickDialogData>(MAT_DIALOG_DATA);

  confirm(): void {
    this.#dialogRef.close(true);
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
