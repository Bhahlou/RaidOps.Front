import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { AvailabilityExceptionDialogComponent, AvailabilityExceptionDialogData } from './availability-exception-dialog.component';
import { AvailabilityStore } from '../../stores/availability.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AvailabilityException } from '../../models/availability.model';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';

const exception = (overrides?: Partial<AvailabilityException>): AvailabilityException => ({
  id: 1,
  startDate: '2026-07-20',
  endDate: '2026-07-20',
  status: DayAvailabilityStatus.Absent,
  reason: null,
  availableFrom: null,
  availableUntil: null,
  ...overrides,
});

describe('AvailabilityExceptionDialogComponent', () => {
  let store: {
    createException: ReturnType<typeof vi.fn>;
    deleteException: ReturnType<typeof vi.fn>;
  };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (data: AvailabilityExceptionDialogData) => {
    store = {
      createException: vi.fn().mockReturnValue(of(undefined)),
      deleteException: vi.fn().mockReturnValue(of(undefined)),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AvailabilityExceptionDialogComponent],
      providers: [
        { provide: AvailabilityStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(AvailabilityExceptionDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(AvailabilityExceptionDialogComponent).componentInstance;
  };

  const newDeclarationData: AvailabilityExceptionDialogData = { guildId: 'g1', date: '2026-07-20' };

  it('should create', () => {
    expect(setup(newDeclarationData)).toBeTruthy();
  });

  // ── isEditing / canRemoveDay ─────────────────────────────────────────────

  describe('isEditing / canRemoveDay', () => {
    it('is not editing and cannot remove a day when there is no existing declaration', () => {
      const component = setup(newDeclarationData);

      expect(component.isEditing).toBe(false);
      expect(component.canRemoveDay).toBe(false);
    });

    it('is editing and can remove a day by default when an existing declaration is passed', () => {
      const component = setup({ ...newDeclarationData, existing: exception() });

      expect(component.isEditing).toBe(true);
      expect(component.canRemoveDay).toBe(true);
    });

    it('cannot remove a day when allowSingleDayRemoval is explicitly false', () => {
      const component = setup({ ...newDeclarationData, existing: exception(), allowSingleDayRemoval: false });

      expect(component.isEditing).toBe(true);
      expect(component.canRemoveDay).toBe(false);
    });
  });

  // ── initial signal values from an existing declaration ──────────────────

  describe('initial signal values', () => {
    it('pre-fills reason from the existing declaration when set', () => {
      const component = setup({ ...newDeclarationData, existing: exception({ reason: 'Vacances' }) });

      expect(component.reason()).toBe('Vacances');
    });

    it('pre-fills the time inputs from the existing declaration, sliced to HH:mm', () => {
      const component = setup({
        ...newDeclarationData,
        existing: exception({ availableFrom: '21:30:00', availableUntil: '23:00:00' }),
      });

      expect(component.availableFrom()).toBe('21:30');
      expect(component.availableUntil()).toBe('23:00');
    });
  });

  // ── canSubmit ─────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false when startDate is null', () => {
      const component = setup(newDeclarationData);
      component.setStartDate(null);

      expect(component.canSubmit()).toBe(false);
    });

    it('is false when endDate is before startDate', () => {
      const component = setup(newDeclarationData);
      component.setStartDate(new Date(2026, 6, 20));
      component.setEndDate(new Date(2026, 6, 19));

      expect(component.canSubmit()).toBe(false);
    });

    it('is true when endDate is on or after startDate and not submitting', () => {
      const component = setup(newDeclarationData);
      component.setStartDate(new Date(2026, 6, 20));
      component.setEndDate(new Date(2026, 6, 20));

      expect(component.canSubmit()).toBe(true);
    });
  });

  describe('submit — guarded by canSubmit', () => {
    it('does nothing when startDate is null', () => {
      const component = setup(newDeclarationData);
      component.setStartDate(null);

      component.submit();

      expect(store.createException).not.toHaveBeenCalled();
    });

    it('does nothing when endDate is before startDate', () => {
      const component = setup(newDeclarationData);
      component.setStartDate(new Date(2026, 6, 20));
      component.setEndDate(new Date(2026, 6, 19));

      component.submit();

      expect(store.createException).not.toHaveBeenCalled();
    });
  });

  // ── submit — new declaration ─────────────────────────────────────────────

  describe('submit (new declaration)', () => {
    it('calls only createException, never deleteException', () => {
      const component = setup(newDeclarationData);

      component.submit();

      expect(store.createException).toHaveBeenCalledTimes(1);
      expect(store.deleteException).not.toHaveBeenCalled();
    });

    it('sends reason as null when left blank', () => {
      const component = setup(newDeclarationData);
      component.reason.set('   ');

      component.submit();

      expect(store.createException).toHaveBeenCalledWith('g1', expect.objectContaining({ reason: null }));
    });

    it('sends availableFrom/availableUntil as null when status is not Partial, even if times were set', () => {
      const component = setup(newDeclarationData);
      component.availableFrom.set('21:30');
      component.setStatus(DayAvailabilityStatus.Absent);

      component.submit();

      expect(store.createException).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ availableFrom: null, availableUntil: null }),
      );
    });

    it('appends :00 to availableFrom/availableUntil when status is Partial', () => {
      const component = setup(newDeclarationData);
      component.setStatus(DayAvailabilityStatus.Partial);
      component.availableFrom.set('21:30');
      component.availableUntil.set('23:00');

      component.submit();

      expect(store.createException).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ availableFrom: '21:30:00', availableUntil: '23:00:00' }),
      );
    });

    it('on success shows a success snackbar and closes the dialog with true', () => {
      const component = setup(newDeclarationData);

      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('calendar.exceptionDialog.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it.each([
      ['InvalidRequest', 'calendar.exceptionDialog.invalidRange'],
      ['PastDeclarationLocked', 'calendar.exceptions.pastLocked'],
      ['SomethingElse', 'errors.server'],
    ])('on %s error, shows the mapped snackbar key, resets submitting, and does not close', (errorCode, expectedKey) => {
      const component = setup(newDeclarationData);
      store.createException.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: errorCode } })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith(expectedKey);
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('falls back to the generic server error when the response has no error body at all', () => {
      const component = setup(newDeclarationData);
      store.createException.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── submit — editing an existing declaration ─────────────────────────────

  describe('submit (editing existing)', () => {
    it('calls deleteException then createException, in that order', () => {
      const component = setup({ ...newDeclarationData, existing: exception({ id: 42 }) });
      const callOrder: string[] = [];
      store.deleteException.mockImplementation(() => {
        callOrder.push('delete');
        return of(undefined);
      });
      store.createException.mockImplementation(() => {
        callOrder.push('create');
        return of(undefined);
      });

      component.submit();

      expect(store.deleteException).toHaveBeenCalledWith('g1', 42);
      expect(callOrder).toEqual(['delete', 'create']);
    });
  });

  // ── removeDay ─────────────────────────────────────────────────────────────

  describe('removeDay', () => {
    it('does nothing when there is no existing declaration', () => {
      const component = setup(newDeclarationData);

      component.removeDay();

      expect(store.deleteException).not.toHaveBeenCalled();
      expect(store.createException).not.toHaveBeenCalled();
    });

    it('deletes the whole declaration without recreating anything when it was a single day', () => {
      const component = setup({
        ...newDeclarationData,
        date: '2026-07-20',
        existing: exception({ id: 5, startDate: '2026-07-20', endDate: '2026-07-20' }),
      });

      component.removeDay();

      expect(store.deleteException).toHaveBeenCalledWith('g1', 5);
      expect(store.createException).not.toHaveBeenCalled();
    });

    it('recreates the remaining sub-range when removing one end of a multi-day declaration', () => {
      const component = setup({
        ...newDeclarationData,
        date: '2026-07-20',
        existing: exception({ id: 5, startDate: '2026-07-20', endDate: '2026-07-22' }),
      });

      component.removeDay();

      expect(store.deleteException).toHaveBeenCalledWith('g1', 5);
      expect(store.createException).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ startDate: '2026-07-21', endDate: '2026-07-22' }),
      );
    });

    it('on success shows the removeDaySuccess snackbar and closes with true', () => {
      const component = setup({ ...newDeclarationData, existing: exception({ id: 5 }) });

      component.removeDay();

      expect(snackbar.success).toHaveBeenCalledWith('calendar.exceptionDialog.removeDaySuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('on error resets submitting, shows the mapped snackbar key, and does not close', () => {
      const component = setup({ ...newDeclarationData, existing: exception({ id: 5 }) });
      store.deleteException.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'InvalidRequest' } })));

      component.removeDay();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('calendar.exceptionDialog.invalidRange');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup(newDeclarationData);

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
