import { HttpErrorResponse } from '@angular/common/http';
import { DialogRef } from '@angular/cdk/dialog';
import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { raidErrorKey } from './raid-error-key.util';

/**
 * Shared submit flow for the raid builder's create/edit/deactivate dialogs: flips `submitting`
 * on, runs `request`, shows a success snackbar and closes the dialog with `true` on success, or
 * resets `submitting` and shows the mapped error snackbar on failure — the exact shape every one
 * of those dialogs repeats around whichever store call it makes.
 */
export function submitRaidDialogRequest(
  submitting: WritableSignal<boolean>,
  snackbar: SnackbarService,
  dialogRef: DialogRef<boolean>,
  successKey: string,
  request: Observable<void>,
): void {
  submitting.set(true);
  request.subscribe({
    next: () => {
      snackbar.success(successKey);
      dialogRef.close(true);
    },
    error: (err: HttpErrorResponse) => {
      submitting.set(false);
      snackbar.error(raidErrorKey(err));
    },
  });
}
