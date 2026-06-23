import { Component, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetSyncPanelComponent } from '../bnet-sync-panel/bnet-sync-panel.component';

export interface SyncBnetDialogData {
  region: string;
}

/** Thin dialog shell around {@link BnetSyncPanelComponent} — owns only dialog-specific chrome (title, cancel/retry actions). */
@Component({
  selector: 'app-sync-bnet-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslocoPipe, BnetSyncPanelComponent],
  templateUrl: './sync-bnet-dialog.component.html',
  styleUrl: './sync-bnet-dialog.component.scss',
})
export class SyncBnetDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SyncBnetDialogComponent>);
  readonly data = inject<SyncBnetDialogData>(MAT_DIALOG_DATA);

  readonly panel = viewChild.required(BnetSyncPanelComponent);

  onSynced(): void {
    this.dialogRef.close({ synced: true });
  }
}
