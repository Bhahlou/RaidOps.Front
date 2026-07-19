import { Component, inject, viewChild } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { BnetSyncPanelComponent, BnetSyncResult } from '../bnet-sync-panel/bnet-sync-panel.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';

export interface SyncBnetDialogData {
  region: string;
  /** Starts the panel straight into add-another mode (header's "Ajouter un autre compte" button). */
  addingAnother?: boolean;
}

/**
 * Thin dialog shell around {@link BnetSyncPanelComponent} — owns only dialog-specific chrome
 * (title, cancel/retry actions). Closes itself on a successful sync, closing with `true` so the
 * caller can chain straight into character selection (import dialog) instead of leaving the user
 * back on the bare characters page. On a mismatched-account error, stays open on the branch grid
 * instead so retrying doesn't require reopening the dialog.
 */
@Component({
  selector: 'app-sync-bnet-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, BnetSyncPanelComponent],
  templateUrl: './sync-bnet-dialog.component.html',
})
export class SyncBnetDialogComponent {
  readonly dialogRef = inject(DialogRef<boolean | undefined>);
  readonly data = inject<SyncBnetDialogData>(DIALOG_DATA);
  readonly #snackbar = inject(SnackbarService);

  readonly panel = viewChild.required(BnetSyncPanelComponent);

  readonly region = this.data.region;
  readonly startInAddAnotherMode = this.data.addingAnother ?? false;

  onSynced({ outcome }: BnetSyncResult): void {
    if (outcome === 'accountAlreadyLinked') {
      this.#snackbar.error('characters.bnet.accounts.accountAlreadyLinked');
      this.panel().reset();
      return;
    }

    this.#snackbar.success('characters.bnet.syncSuccess');
    this.dialogRef.close(true);
  }
}
