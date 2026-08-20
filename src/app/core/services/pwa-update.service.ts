import { inject, Service } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

/**
 * Reacts to the Angular service worker's `VERSION_READY` event (a new deploy was detected and
 * downloaded in the background) by prompting the user to reload. No-op if the service worker
 * isn't enabled (dev mode, or an unsupported browser) — `SwUpdate.isEnabled` guards that.
 */
@Service()
export class PwaUpdateService {
  readonly #swUpdate = inject(SwUpdate);
  readonly #dialog = inject(Dialog);
  readonly #document = inject(DOCUMENT);

  constructor() {
    if (!this.#swUpdate.isEnabled) return;

    this.#swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.#promptReload());
  }

  #promptReload(): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'pwaUpdate.title',
          message: 'pwaUpdate.message',
          confirmLabel: 'pwaUpdate.reload',
          cancelLabel: 'pwaUpdate.later',
          danger: false,
        },
      })
      .closed.subscribe((confirmed) => {
        if (confirmed) this.#document.location.reload();
      });
  }
}
