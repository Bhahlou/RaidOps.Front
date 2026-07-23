import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { RecurringPatternDialogComponent, RecurringPatternDialogData } from './recurring-pattern-dialog.component';
import { AvailabilityStore } from '../../stores/availability.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RecurringAvailabilityPattern, RecurringAvailabilityPatternDay } from '../../models/availability.model';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';

const patternDay = (overrides?: Partial<RecurringAvailabilityPatternDay>): RecurringAvailabilityPatternDay => ({
  offsetInCycle: 0,
  status: DayAvailabilityStatus.Absent,
  reason: null,
  availableFrom: null,
  availableUntil: null,
  ...overrides,
});

const pattern = (overrides?: Partial<RecurringAvailabilityPattern>): RecurringAvailabilityPattern => ({
  id: 9,
  label: 'Rotation',
  cycleLengthDays: 7,
  anchorDate: '2026-01-05', // a Monday
  days: [],
  ...overrides,
});

describe('RecurringPatternDialogComponent', () => {
  let store: {
    createPattern: ReturnType<typeof vi.fn>;
    updatePattern: ReturnType<typeof vi.fn>;
  };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let transloco: {
    getActiveLang: ReturnType<typeof vi.fn>;
    activeLang: ReturnType<typeof signal>;
    translate: ReturnType<typeof vi.fn>;
  };

  const setup = (data: RecurringPatternDialogData) => {
    store = {
      createPattern: vi.fn().mockReturnValue(of(undefined)),
      updatePattern: vi.fn().mockReturnValue(of(undefined)),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };
    transloco = {
      getActiveLang: vi.fn(() => 'fr'),
      activeLang: signal('fr'),
      translate: vi.fn((key: string, params?: Record<string, string | number>) => (params ? `${key}:${JSON.stringify(params)}` : key)),
    };

    TestBed.configureTestingModule({
      imports: [RecurringPatternDialogComponent],
      providers: [
        { provide: AvailabilityStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(RecurringPatternDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RecurringPatternDialogComponent).componentInstance;
  };

  const createData: RecurringPatternDialogData = { guildId: 'g1', pattern: null };

  it('should create', () => {
    expect(setup(createData)).toBeTruthy();
  });

  // ── initial state ─────────────────────────────────────────────────────────

  describe('create mode (no existing pattern)', () => {
    it('defaults to weekly mode with 7 Available slots', () => {
      const component = setup(createData);

      expect(component.mode()).toBe('weekly');
      expect(component.weeklySlots()).toHaveLength(7);
      expect(component.weeklySlots().every((s) => s.status === DayAvailabilityStatus.Available)).toBe(true);
    });

    it('defaults label to empty and cycleLengthDays to 10 for advanced mode', () => {
      const component = setup(createData);

      expect(component.label()).toBe('');
      expect(component.cycleLengthDays()).toBe(10);
    });
  });

  describe('edit mode with a weekly pattern (cycleLengthDays === 7)', () => {
    it('starts in weekly mode and places each day at its weekday-shifted offset', () => {
      // Anchor 2026-01-05 is a Monday (weekday index 0) — a day at offsetInCycle 2 lands on
      // Wednesday, i.e. weekly-slot index 2, matching the anchor's own weekday alignment.
      const existing = pattern({
        cycleLengthDays: 7,
        anchorDate: '2026-01-05',
        days: [patternDay({ offsetInCycle: 2, status: DayAvailabilityStatus.Partial, availableFrom: '18:00:00' })],
      });
      const component = setup({ guildId: 'g1', pattern: existing });

      expect(component.mode()).toBe('weekly');
      expect(component.weeklySlots()[2].status).toBe(DayAvailabilityStatus.Partial);
      expect(component.weeklySlots()[2].availableFrom).toBe('18:00:00');
      expect(component.weeklySlots().filter((s) => s.status !== DayAvailabilityStatus.Available)).toHaveLength(1);
    });

    it('pre-fills the label', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ label: 'Soirées raid' }) });

      expect(component.label()).toBe('Soirées raid');
    });
  });

  describe('edit mode with a shift-rotation pattern (cycleLengthDays !== 7)', () => {
    it('starts in advanced mode and places each day at its raw offset (no weekday shift)', () => {
      const existing = pattern({
        cycleLengthDays: 10,
        anchorDate: '2026-01-05',
        days: [patternDay({ offsetInCycle: 4, status: DayAvailabilityStatus.Absent })],
      });
      const component = setup({ guildId: 'g1', pattern: existing });

      expect(component.mode()).toBe('advanced');
      expect(component.cycleLengthDays()).toBe(10);
      expect(component.advancedSlots()).toHaveLength(10);
      expect(component.advancedSlots()[4].status).toBe(DayAvailabilityStatus.Absent);
    });
  });

  // ── weekdayNames / advancedLabels / anchorDateInputValue ────────────────

  describe('weekdayNames', () => {
    it('returns 7 labels', () => {
      const component = setup(createData);

      expect(component.weekdayNames()).toHaveLength(7);
    });

    it('is used as activeLabels in weekly mode', () => {
      const component = setup(createData);

      expect(component.activeLabels()).toEqual(component.weekdayNames());
    });
  });

  describe('advancedLabels', () => {
    it('returns one "Jour N" label per advanced slot, 1-indexed', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 3 }) });

      expect(component.advancedLabels()).toEqual([
        'calendar.patternDialog.dayNumber:{"n":1}',
        'calendar.patternDialog.dayNumber:{"n":2}',
        'calendar.patternDialog.dayNumber:{"n":3}',
      ]);
    });

    it('is used as activeLabels in advanced mode', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });

      expect(component.activeLabels()).toEqual(component.advancedLabels());
    });
  });

  describe('anchorDateInputValue', () => {
    it('returns the ISO date string for the current anchor date', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10, anchorDate: '2026-02-01' }) });

      expect(component.anchorDateInputValue()).toBe('2026-02-01');
    });

    it('returns an empty string when the anchor date is cleared', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });
      component.setAnchorDate('');

      expect(component.anchorDateInputValue()).toBe('');
    });
  });

  // ── setCycleLengthDays ───────────────────────────────────────────────────

  describe('setCycleLengthDays', () => {
    it('clamps below 1 up to 1', () => {
      const component = setup(createData);

      component.setCycleLengthDays(0);

      expect(component.cycleLengthDays()).toBe(1);
    });

    it('clamps above the 60-day maximum', () => {
      const component = setup(createData);

      component.setCycleLengthDays(100);

      expect(component.cycleLengthDays()).toBe(60);
    });

    it('grows advancedSlots with new Available slots when increasing the length', () => {
      const component = setup(createData);
      component.mode.set('advanced');
      component.updateSlot(0, { status: DayAvailabilityStatus.Absent });

      component.setCycleLengthDays(12);

      expect(component.advancedSlots()).toHaveLength(12);
      expect(component.advancedSlots()[0].status).toBe(DayAvailabilityStatus.Absent); // preserved
      expect(component.advancedSlots()[11].status).toBe(DayAvailabilityStatus.Available); // new
    });

    it('shrinks advancedSlots by truncation, preserving the remaining slots', () => {
      const component = setup(createData);
      component.mode.set('advanced');
      component.updateSlot(9, { status: DayAvailabilityStatus.Absent });

      component.setCycleLengthDays(5);

      expect(component.advancedSlots()).toHaveLength(5);
      expect(component.advancedSlots().every((s) => s.status === DayAvailabilityStatus.Available)).toBe(true);
    });
  });

  // ── activeSlots / updateSlot ─────────────────────────────────────────────

  describe('updateSlot', () => {
    it('updates weeklySlots when in weekly mode', () => {
      const component = setup(createData);

      component.updateSlot(3, { status: DayAvailabilityStatus.Absent, reason: 'Boulot' });

      expect(component.weeklySlots()[3]).toMatchObject({ status: DayAvailabilityStatus.Absent, reason: 'Boulot' });
      expect(component.activeSlots()[3].status).toBe(DayAvailabilityStatus.Absent);
    });

    it('updates advancedSlots when in advanced mode', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });

      component.updateSlot(1, { status: DayAvailabilityStatus.Partial, availableUntil: '23:00:00' });

      expect(component.advancedSlots()[1]).toMatchObject({ status: DayAvailabilityStatus.Partial, availableUntil: '23:00:00' });
      expect(component.activeSlots()[1]).toMatchObject({ status: DayAvailabilityStatus.Partial, availableUntil: '23:00:00' });
    });

    it('does not affect the other slots', () => {
      const component = setup(createData);

      component.updateSlot(3, { status: DayAvailabilityStatus.Absent });

      expect(component.weeklySlots()[0].status).toBe(DayAvailabilityStatus.Available);
      expect(component.weeklySlots()[2].status).toBe(DayAvailabilityStatus.Available);
    });
  });

  // ── canSubmit ─────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is true in weekly mode regardless of anchor date', () => {
      const component = setup(createData);

      expect(component.canSubmit()).toBe(true);
    });

    it('is true in advanced mode when an anchor date is set (defaulted to today)', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });

      expect(component.canSubmit()).toBe(true);
    });

    it('is false in advanced mode when the anchor date is cleared', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });

      component.setAnchorDate('');

      expect(component.canSubmit()).toBe(false);
    });

    it('is false when a slot is Partial with neither time bound set', () => {
      const component = setup(createData);
      component.updateSlot(1, { status: DayAvailabilityStatus.Partial });

      expect(component.hasSlotMissingBounds()).toBe(true);
      expect(component.canSubmit()).toBe(false);
    });

    it.each([
      ['21:30:00', null],
      [null, '23:00:00'],
      ['21:30:00', '23:00:00'],
    ])('is true when the Partial slot has at least one bound set (from=%s, until=%s)', (availableFrom, availableUntil) => {
      const component = setup(createData);
      component.updateSlot(1, { status: DayAvailabilityStatus.Partial, availableFrom, availableUntil });

      expect(component.hasSlotMissingBounds()).toBe(false);
      expect(component.canSubmit()).toBe(true);
    });

    it('only considers active-mode slots, ignoring the other mode entirely', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });
      component.mode.set('advanced');
      // weeklySlots is the inactive mode here — a Partial slot missing bounds there must not block advanced mode.
      component.weeklySlots.update((slots) => slots.map((s, i) => (i === 0 ? { ...s, status: DayAvailabilityStatus.Partial } : s)));

      expect(component.canSubmit()).toBe(true);
    });
  });

  describe('slotMissingBounds', () => {
    it('is true only for a Partial slot with neither bound set', () => {
      const component = setup(createData);

      expect(component.slotMissingBounds({ status: DayAvailabilityStatus.Partial, reason: null, availableFrom: null, availableUntil: null })).toBe(true);
      expect(component.slotMissingBounds({ status: DayAvailabilityStatus.Partial, reason: null, availableFrom: '09:00:00', availableUntil: null })).toBe(false);
      expect(component.slotMissingBounds({ status: DayAvailabilityStatus.Absent, reason: null, availableFrom: null, availableUntil: null })).toBe(false);
    });
  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit — create (weekly)', () => {
    it('calls createPattern with cycleLengthDays 7 and only non-Available days', () => {
      const component = setup(createData);
      component.updateSlot(1, { status: DayAvailabilityStatus.Absent, reason: 'Boulot' });

      component.submit();

      expect(store.createPattern).toHaveBeenCalledWith('g1', expect.objectContaining({
        cycleLengthDays: 7,
        days: [{ offsetInCycle: 1, status: DayAvailabilityStatus.Absent, reason: 'Boulot', availableFrom: null, availableUntil: null }],
      }));
      expect(store.updatePattern).not.toHaveBeenCalled();
    });

    it('sends label as null when left blank', () => {
      const component = setup(createData);

      component.submit();

      expect(store.createPattern).toHaveBeenCalledWith('g1', expect.objectContaining({ label: null }));
    });
  });

  describe('submit — create (advanced)', () => {
    it('calls createPattern with the current cycleLengthDays and anchorDate', () => {
      const component = setup({ guildId: 'g1', pattern: null });
      component.mode.set('advanced');
      component.setCycleLengthDays(10);
      component.setAnchorDate('2026-02-01');
      component.updateSlot(3, { status: DayAvailabilityStatus.Absent });

      component.submit();

      expect(store.createPattern).toHaveBeenCalledWith('g1', expect.objectContaining({
        cycleLengthDays: 10,
        anchorDate: '2026-02-01',
        days: [{ offsetInCycle: 3, status: DayAvailabilityStatus.Absent, reason: null, availableFrom: null, availableUntil: null }],
      }));
    });

    it('does nothing when the anchor date is cleared', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });
      component.setAnchorDate('');

      component.submit();

      expect(store.createPattern).not.toHaveBeenCalled();
    });
  });

  describe('submit — editing an existing pattern', () => {
    it('calls updatePattern with the pattern id, not createPattern', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ id: 42 }) });

      component.submit();

      expect(store.updatePattern).toHaveBeenCalledWith('g1', 42, expect.anything());
      expect(store.createPattern).not.toHaveBeenCalled();
    });
  });

  describe('submit — outcomes', () => {
    it('on success shows a success snackbar and closes the dialog with true', () => {
      const component = setup(createData);

      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('calendar.patternDialog.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('on InvalidRequest error shows the mapped snackbar key and resets submitting without closing', () => {
      const component = setup(createData);
      store.createPattern.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'InvalidRequest' } })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('calendar.patternDialog.invalidPattern');
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('on an unrecognized error shows the generic server error key', () => {
      const component = setup(createData);
      store.createPattern.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'SomethingElse' } })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('falls back to the generic server error when the response has no error body at all', () => {
      const component = setup(createData);
      store.createPattern.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('does nothing when canSubmit is false', () => {
      const component = setup({ guildId: 'g1', pattern: pattern({ cycleLengthDays: 10 }) });
      component.setAnchorDate('');

      component.submit();

      expect(store.createPattern).not.toHaveBeenCalled();
      expect(store.updatePattern).not.toHaveBeenCalled();
    });

    it('does nothing when a slot is Partial with neither time bound set', () => {
      const component = setup(createData);
      component.updateSlot(1, { status: DayAvailabilityStatus.Partial });

      component.submit();

      expect(store.createPattern).not.toHaveBeenCalled();
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup(createData);

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
