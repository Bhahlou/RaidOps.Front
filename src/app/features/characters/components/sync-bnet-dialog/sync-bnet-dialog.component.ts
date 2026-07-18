import { Component, inject, viewChild } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { BnetSyncPanelComponent } from '../bnet-sync-panel/bnet-sync-panel.component';

export interface SyncBnetDialogData {
  region: string;
}

/** Thin dialog shell around {@link BnetSyncPanelComponent} — owns only dialog-specific chrome (title, cancel/retry actions). */
@Component({
  selector: 'app-sync-bnet-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, BnetSyncPanelComponent],
  templateUrl: './sync-bnet-dialog.component.html',
})
export class SyncBnetDialogComponent {
  readonly dialogRef = inject(DialogRef<{ synced: boolean } | undefined>);
  readonly data = inject<SyncBnetDialogData>(DIALOG_DATA);

  readonly panel = viewChild.required(BnetSyncPanelComponent);

  onSynced(): void {
    this.dialogRef.close({ synced: true });
  }
}
