import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { submitRaidDialogRequest } from './dialog-submit.util';

describe('submitRaidDialogRequest', () => {
  let submitting: ReturnType<typeof signal<boolean>>;
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    submitting = signal(false);
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };
  });

  it('flips submitting on — the success path never resets it, since the dialog closes anyway', () => {
    submitRaidDialogRequest(submitting, snackbar as never, dialogRef as never, 'success.key', of(undefined));

    expect(submitting()).toBe(true);
  });

  it('shows the success snackbar and closes the dialog with true on success', () => {
    submitRaidDialogRequest(submitting, snackbar as never, dialogRef as never, 'success.key', of(undefined));

    expect(snackbar.success).toHaveBeenCalledWith('success.key');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('resets submitting and shows the mapped error snackbar on failure, without closing', () => {
    submitRaidDialogRequest(
      submitting,
      snackbar as never,
      dialogRef as never,
      'success.key',
      throwError(() => new HttpErrorResponse({ error: { error: 'SlotOccupied' } })),
    );

    expect(submitting()).toBe(false);
    expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.slotOccupied');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
