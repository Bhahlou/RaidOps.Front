import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { of, Subject } from 'rxjs';

import { PwaUpdateService } from './pwa-update.service';
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

describe('PwaUpdateService', () => {
  let versionUpdates$: Subject<VersionEvent>;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let reload: ReturnType<typeof vi.fn>;

  const setup = (isEnabled = true) => {
    versionUpdates$ = new Subject<VersionEvent>();
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    reload = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled, versionUpdates: versionUpdates$.asObservable() } },
        { provide: Dialog, useValue: dialog },
        { provide: DOCUMENT, useValue: { location: { reload } } },
      ],
    });

    return TestBed.inject(PwaUpdateService);
  };

  const readyEvent = { type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } } as VersionEvent;
  const detectedEvent = { type: 'VERSION_DETECTED', version: { hash: 'b' } } as VersionEvent;

  it('does nothing when the service worker is not enabled', () => {
    setup(false);

    versionUpdates$.next(readyEvent);

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens the confirm dialog on VERSION_READY', () => {
    setup();

    versionUpdates$.next(readyEvent);

    expect(dialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({
        data: {
          title: 'pwaUpdate.title',
          message: 'pwaUpdate.message',
          confirmLabel: 'pwaUpdate.reload',
          cancelLabel: 'pwaUpdate.later',
          danger: false,
        },
      }),
    );
  });

  it('ignores version events other than VERSION_READY', () => {
    setup();

    versionUpdates$.next(detectedEvent);

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('reloads the document when the user confirms the reload', () => {
    setup();
    dialog.open.mockReturnValue({ closed: of(true) });

    versionUpdates$.next(readyEvent);

    expect(reload).toHaveBeenCalled();
  });

  it('does not reload the document when the user dismisses the dialog', () => {
    setup();
    dialog.open.mockReturnValue({ closed: of(false) });

    versionUpdates$.next(readyEvent);

    expect(reload).not.toHaveBeenCalled();
  });
});
