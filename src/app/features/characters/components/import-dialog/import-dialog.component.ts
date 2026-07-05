import { Component, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterActivationPanelComponent } from '../character-activation-panel/character-activation-panel.component';

/** Thin dialog shell around {@link CharacterActivationPanelComponent} — owns only dialog-specific chrome (title, action buttons that drive the panel). */
@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
    CharacterActivationPanelComponent,
  ],
  templateUrl: './import-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './import-dialog.component.scss',
})
export class ImportDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ImportDialogComponent>);

  readonly panel = viewChild.required(CharacterActivationPanelComponent);
}
