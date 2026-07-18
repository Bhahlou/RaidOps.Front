import { Component, inject, viewChild } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CharacterActivationPanelComponent } from '../character-activation-panel/character-activation-panel.component';

export type ImportDialogResult =
  | { activated: number; activatedCharacterIds: number[] }
  | { error: true }
  | { openSync: true };

/** Thin dialog shell around {@link CharacterActivationPanelComponent} — owns only dialog-specific chrome (title, action buttons that drive the panel). */
@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, CharacterActivationPanelComponent],
  templateUrl: './import-dialog.component.html',
  styleUrl: './import-dialog.component.scss',
})
export class ImportDialogComponent {
  readonly dialogRef = inject(DialogRef<ImportDialogResult | undefined>);

  readonly panel = viewChild.required(CharacterActivationPanelComponent);
}
