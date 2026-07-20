import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildCalendarComponent } from './guild-calendar.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AvailabilityStore } from '../../stores/availability.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AvailabilityExceptionDialogComponent } from '../../components/availability-exception-dialog/availability-exception-dialog.component';
import { RecurringPatternDialogComponent } from '../../components/recurring-pattern-dialog/recurring-pattern-dialog.component';
import { AvailabilityCalendar, AvailabilityException } from '../../models/availability.model';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';

const exception = (overrides?: Partial<AvailabilityException>): AvailabilityException => ({
  id: 1,
  startDate: '2026-01-01',
  endDate: '2026-01-01',
  status: DayAvailabilityStatus.Absent,
  reason: null,
  availableFrom: null,
  availableUntil: null,
  ...overrides,
});

describe('GuildCalendarComponent', () => {
  let store: {
    calendar: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    loadRange: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    createException: ReturnType<typeof vi.fn>;
    deleteException: ReturnType<typeof vi.fn>;
    createPattern: ReturnType<typeof vi.fn>;
    updatePattern: ReturnType<typeof vi.fn>;
    deletePattern: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let transloco: {
    getActiveLang: ReturnType<typeof vi.fn>;
    activeLang: ReturnType<typeof signal>;
    translate: ReturnType<typeof vi.fn>;
  };

  const setup = (guildId: string | null = 'g1') => {
    store = {
      calendar: signal(null),
      isLoading: signal(false),
      loadRange: vi.fn(),
      reload: vi.fn(),
      createException: vi.fn().mockReturnValue(of(undefined)),
      deleteException: vi.fn().mockReturnValue(of(undefined)),
      createPattern: vi.fn().mockReturnValue(of(undefined)),
      updatePattern: vi.fn().mockReturnValue(of(undefined)),
      deletePattern: vi.fn().mockReturnValue(of(undefined)),
    };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    transloco = {
      getActiveLang: vi.fn(() => 'fr'),
      activeLang: signal('fr'),
      translate: vi.fn((key: string) => key),
    };

    TestBed.configureTestingModule({
      imports: [GuildCalendarComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(null) } },
        { provide: AvailabilityStore, useValue: store },
        { provide: Dialog, useValue: dialog },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(GuildCalendarComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(GuildCalendarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.calendar on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.calendar');
  });

  it('loads the current month range on creation', () => {
    setup('g1');

    expect(store.loadRange).toHaveBeenCalledWith('g1', expect.any(String), expect.any(String));
  });

  // ── month navigation ────────────────────────────────────────────────────

  describe('month navigation', () => {
    it('prevMonth moves the label back one month', () => {
      const component = setup('g1');
      const before = component.monthLabel();

      component.prevMonth();

      expect(component.monthLabel()).not.toBe(before);
    });

    it('nextMonth moves the label forward one month', () => {
      const component = setup('g1');
      const before = component.monthLabel();

      component.nextMonth();

      expect(component.monthLabel()).not.toBe(before);
    });

    it('goToday resets to the current month after navigating away', () => {
      const component = setup('g1');
      component.nextMonth();
      component.nextMonth();
      TestBed.tick();
      const navigatedAwayCallCount = store.loadRange.mock.calls.length;

      component.goToday();
      TestBed.tick();

      expect(store.loadRange.mock.calls.length).toBeGreaterThan(navigatedAwayCallCount);
    });
  });

  // ── exception lock checks ───────────────────────────────────────────────

  describe('isExceptionEditLocked', () => {
    it('is true once startDate is before today', () => {
      const component = setup('g1');
      const yesterday = addDaysToIso(todayIso(), -1);

      expect(component.isExceptionEditLocked(exception({ startDate: yesterday, endDate: yesterday }))).toBe(true);
    });

    it('is false when startDate is today or in the future', () => {
      const component = setup('g1');
      const today = todayIso();
      const tomorrow = addDaysToIso(today, 1);

      expect(component.isExceptionEditLocked(exception({ startDate: today, endDate: today }))).toBe(false);
      expect(component.isExceptionEditLocked(exception({ startDate: tomorrow, endDate: tomorrow }))).toBe(false);
    });
  });

  describe('isExceptionDeleteLocked', () => {
    it('is true once endDate is before today', () => {
      const component = setup('g1');
      const yesterday = addDaysToIso(todayIso(), -1);

      expect(component.isExceptionDeleteLocked(exception({ startDate: yesterday, endDate: yesterday }))).toBe(true);
    });

    it('is false when endDate is today or in the future', () => {
      const component = setup('g1');
      const today = todayIso();

      expect(component.isExceptionDeleteLocked(exception({ startDate: today, endDate: today }))).toBe(false);
    });
  });

  // ── deletePattern ────────────────────────────────────────────────────────

  describe('deletePattern', () => {
    const pattern = { id: 9, label: 'Rotation 5x8', cycleLengthDays: 10, anchorDate: '2026-01-01', days: [] };

    it('opens a ConfirmDialogComponent before deleting', () => {
      const component = setup('g1');

      component.deletePattern(pattern);

      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.anything());
    });

    it('calls store.deletePattern when the confirm dialog resolves true', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(true) });

      component.deletePattern(pattern);

      expect(store.deletePattern).toHaveBeenCalledWith('g1', pattern.id);
    });

    it('does not call store.deletePattern when the confirm dialog resolves false', () => {
      dialog.open.mockReturnValue({ closed: of(false) });
      const component = setup('g1');

      component.deletePattern(pattern);

      expect(store.deletePattern).not.toHaveBeenCalled();
    });

    it('on error shows the generic server error snackbar', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(true) });
      store.deletePattern.mockReturnValue(throwError(() => new Error('boom')));

      component.deletePattern(pattern);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('falls back to the translated "unnamed" label when the pattern has no label', () => {
      const component = setup('g1');
      const unnamedPattern = { ...pattern, label: '' };

      component.deletePattern(unnamedPattern);

      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.objectContaining({
        data: expect.objectContaining({
          messageParams: { label: 'calendar.patternDialog.unnamed' },
        }),
      }));
    });
  });

  // ── patterns / exceptions / calendarDays ─────────────────────────────────

  describe('patterns / exceptions', () => {
    it('returns an empty array when the store has no calendar loaded yet', () => {
      const component = setup('g1');

      expect(component.patterns()).toEqual([]);
      expect(component.exceptions()).toEqual([]);
    });

    it('sorts exceptions by startDate ascending', () => {
      const component = setup('g1');
      const calendar: AvailabilityCalendar = {
        days: [],
        exceptions: [exception({ id: 1, startDate: '2026-03-01' }), exception({ id: 2, startDate: '2026-01-01' })],
        patterns: [],
      };
      store.calendar.set(calendar);

      expect(component.exceptions().map((e) => e.id)).toEqual([2, 1]);
    });

    it('returns the patterns straight from the loaded calendar', () => {
      const component = setup('g1');
      const calendar: AvailabilityCalendar = {
        days: [],
        exceptions: [],
        patterns: [{ id: 9, label: 'Rotation', cycleLengthDays: 7, anchorDate: '2026-01-05', days: [] }],
      };
      store.calendar.set(calendar);

      expect(component.patterns()).toEqual(calendar.patterns);
    });
  });

  describe('calendarDays', () => {
    it('produces a 42-day grid marking today and days outside the current month', () => {
      const component = setup('g1');

      const days = component.calendarDays();

      expect(days).toHaveLength(42);
      expect(days.some((d) => d.isToday)).toBe(true);
      expect(days.some((d) => !d.inCurrentMonth)).toBe(true);
    });

    it('attaches the resolved day matching each grid day\'s ISO date', () => {
      const component = setup('g1');
      const today = todayIso();
      const calendar: AvailabilityCalendar = {
        days: [{ date: today, status: DayAvailabilityStatus.Absent, reason: null, availableFrom: null, availableUntil: null, isException: true }],
        exceptions: [],
        patterns: [],
      };
      store.calendar.set(calendar);

      const todayCell = component.calendarDays().find((d) => d.iso === today);

      expect(todayCell?.resolved?.status).toBe(DayAvailabilityStatus.Absent);
    });
  });

  // ── openExceptionDialog ──────────────────────────────────────────────────

  describe('openExceptionDialog', () => {
    it('opens the dialog for a future day with no existing declaration', () => {
      const component = setup('g1');
      const tomorrow = addDaysToIso(todayIso(), 1);

      component.openExceptionDialog({ date: new Date(), iso: tomorrow, inCurrentMonth: true, isToday: false, resolved: null });

      expect(dialog.open).toHaveBeenCalledWith(AvailabilityExceptionDialogComponent, expect.objectContaining({
        data: expect.objectContaining({ guildId: 'g1', date: tomorrow, existing: null }),
      }));
    });

    it('blocks and shows pastLocked for a past day with no existing declaration', () => {
      const component = setup('g1');
      const yesterday = addDaysToIso(todayIso(), -1);

      component.openExceptionDialog({ date: new Date(), iso: yesterday, inCurrentMonth: true, isToday: false, resolved: null });

      expect(snackbar.error).toHaveBeenCalledWith('calendar.exceptions.pastLocked');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the dialog for today with no day argument (declare button)', () => {
      const component = setup('g1');

      component.openExceptionDialog();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('reloads the store when the dialog closes with true', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(true) });
      const tomorrow = addDaysToIso(todayIso(), 1);

      component.openExceptionDialog({ date: new Date(), iso: tomorrow, inCurrentMonth: true, isToday: false, resolved: null });

      expect(store.reload).toHaveBeenCalled();
    });

    it('does not reload the store when the dialog closes with false', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(false) });
      const tomorrow = addDaysToIso(todayIso(), 1);

      component.openExceptionDialog({ date: new Date(), iso: tomorrow, inCurrentMonth: true, isToday: false, resolved: null });

      expect(store.reload).not.toHaveBeenCalled();
    });

    it('opens the dialog for an editable day that already has a declaration', () => {
      const component = setup('g1');
      const tomorrow = addDaysToIso(todayIso(), 1);
      const existing = exception({ id: 7, startDate: tomorrow, endDate: tomorrow });
      store.calendar.set({ days: [], exceptions: [existing], patterns: [] });

      component.openExceptionDialog({ date: new Date(), iso: tomorrow, inCurrentMonth: true, isToday: false, resolved: null });

      expect(dialog.open).toHaveBeenCalledWith(AvailabilityExceptionDialogComponent, expect.objectContaining({
        data: expect.objectContaining({ existing }),
      }));
    });

    it('blocks and shows pastLocked for a day whose existing declaration is already edit-locked', () => {
      const component = setup('g1');
      const yesterday = addDaysToIso(todayIso(), -1);
      const existing = exception({ id: 7, startDate: yesterday, endDate: yesterday });
      store.calendar.set({ days: [], exceptions: [existing], patterns: [] });

      component.openExceptionDialog({ date: new Date(), iso: yesterday, inCurrentMonth: true, isToday: false, resolved: null });

      expect(snackbar.error).toHaveBeenCalledWith('calendar.exceptions.pastLocked');
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  // ── editException ────────────────────────────────────────────────────────

  describe('editException', () => {
    it('blocks and shows pastLocked when the declaration is edit-locked', () => {
      const component = setup('g1');
      const locked = exception({ startDate: addDaysToIso(todayIso(), -1) });

      component.editException(locked);

      expect(snackbar.error).toHaveBeenCalledWith('calendar.exceptions.pastLocked');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the dialog with allowSingleDayRemoval false when editable', () => {
      const component = setup('g1');
      const editable = exception({ startDate: addDaysToIso(todayIso(), 1) });

      component.editException(editable);

      expect(dialog.open).toHaveBeenCalledWith(AvailabilityExceptionDialogComponent, expect.objectContaining({
        data: expect.objectContaining({ existing: editable, allowSingleDayRemoval: false }),
      }));
    });

    it('reloads the store when the dialog closes with true', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(true) });
      const editable = exception({ startDate: addDaysToIso(todayIso(), 1) });

      component.editException(editable);

      expect(store.reload).toHaveBeenCalled();
    });

    it('does not reload the store when the dialog closes with false', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(false) });
      const editable = exception({ startDate: addDaysToIso(todayIso(), 1) });

      component.editException(editable);

      expect(store.reload).not.toHaveBeenCalled();
    });
  });

  // ── deleteException ──────────────────────────────────────────────────────

  describe('deleteException', () => {
    it('blocks and shows pastLocked when the declaration is delete-locked', () => {
      const component = setup('g1');
      const locked = exception({ endDate: addDaysToIso(todayIso(), -1) });

      component.deleteException(locked);

      expect(snackbar.error).toHaveBeenCalledWith('calendar.exceptions.pastLocked');
      expect(store.deleteException).not.toHaveBeenCalled();
    });

    it('on success shows a success snackbar and reloads', () => {
      const component = setup('g1');
      const deletable = exception({ id: 3, endDate: addDaysToIso(todayIso(), 1) });

      component.deleteException(deletable);

      expect(store.deleteException).toHaveBeenCalledWith('g1', 3);
      expect(snackbar.success).toHaveBeenCalledWith('calendar.exceptions.deleteSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('on error shows the generic server error snackbar', () => {
      const component = setup('g1');
      store.deleteException.mockReturnValue(throwError(() => new Error('boom')));
      const deletable = exception({ id: 3, endDate: addDaysToIso(todayIso(), 1) });

      component.deleteException(deletable);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── exceptionRangeLabel / exceptionDetailLabel ──────────────────────────

  describe('exceptionRangeLabel', () => {
    it('returns a single formatted date for a one-day exception', () => {
      const component = setup('g1');

      const label = component.exceptionRangeLabel(exception({ startDate: '2026-07-23', endDate: '2026-07-23' }));

      expect(label).toBe(new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date(2026, 6, 23)));
    });

    it('returns a range for a multi-day exception', () => {
      const component = setup('g1');
      const fmt = (d: Date) => new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(d);

      const label = component.exceptionRangeLabel(exception({ startDate: '2026-07-23', endDate: '2026-07-24' }));

      expect(label).toBe(`${fmt(new Date(2026, 6, 23))} – ${fmt(new Date(2026, 6, 24))}`);
    });
  });

  describe('exceptionDetailLabel', () => {
    it('shows the status word alone for a non-Partial exception with no reason', () => {
      const component = setup('g1');

      expect(component.exceptionDetailLabel(exception({ status: DayAvailabilityStatus.Absent, reason: null })))
        .toBe('calendar.status.absent');
    });

    it('combines status and reason for a non-Partial exception', () => {
      const component = setup('g1');

      expect(component.exceptionDetailLabel(exception({ status: DayAvailabilityStatus.Absent, reason: 'Vacances' })))
        .toBe('calendar.status.absent · Vacances');
    });

    it('uses the availableOverride status key for an Available exception', () => {
      const component = setup('g1');

      expect(component.exceptionDetailLabel(exception({ status: DayAvailabilityStatus.Available, reason: null })))
        .toBe('calendar.status.availableOverride');
    });

    it('combines reason and time label for a Partial exception with both', () => {
      const component = setup('g1');

      const label = component.exceptionDetailLabel(exception({
        status: DayAvailabilityStatus.Partial, reason: 'Boulot', availableFrom: '21:30:00',
      }));

      expect(label).toContain('Boulot (');
    });

    it('returns just the reason for a Partial exception with a reason but no time bounds', () => {
      const component = setup('g1');

      const label = component.exceptionDetailLabel(exception({
        status: DayAvailabilityStatus.Partial, reason: 'Sieste', availableFrom: null, availableUntil: null,
      }));

      expect(label).toBe('Sieste');
    });

    it('returns just the time label for a Partial exception with time bounds but no reason', () => {
      const component = setup('g1');

      const label = component.exceptionDetailLabel(exception({
        status: DayAvailabilityStatus.Partial, reason: null, availableFrom: '21:30:00',
      }));

      expect(label).not.toBe('calendar.status.partial');
      expect(label).not.toBeNull();
    });

    it('falls back to the plain "Partiel" word for a Partial exception with no reason or time bounds', () => {
      const component = setup('g1');

      const label = component.exceptionDetailLabel(exception({
        status: DayAvailabilityStatus.Partial, reason: null, availableFrom: null, availableUntil: null,
      }));

      expect(label).toBe('calendar.status.partial');
    });
  });

  // ── openPatternDialog ────────────────────────────────────────────────────

  describe('openPatternDialog', () => {
    it('opens the pattern dialog with the given pattern (or null to create)', () => {
      const component = setup('g1');

      component.openPatternDialog(null);

      expect(dialog.open).toHaveBeenCalledWith(RecurringPatternDialogComponent, expect.objectContaining({
        data: { guildId: 'g1', pattern: null },
      }));
    });

    it('reloads the store when the dialog closes with true', () => {
      const component = setup('g1');
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openPatternDialog(null);

      expect(store.reload).toHaveBeenCalled();
    });
  });
});

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysToIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
