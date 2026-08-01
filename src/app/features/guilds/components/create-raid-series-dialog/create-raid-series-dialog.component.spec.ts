import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CreateRaidSeriesDialogComponent, CreateRaidSeriesDialogData } from './create-raid-series-dialog.component';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidSeries } from '../../models/raid-series.model';
import { RaidZone } from '../../models/raid-zone.model';
import { SignupMode } from '../../models/signup-mode.enum';

const zone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 10,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 1,
  ...overrides,
});

const series = (overrides?: Partial<RaidSeries>): RaidSeries => ({
  id: 4,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  recurrenceDayOfWeek: 'Wednesday',
  recurrenceStartTimeLocal: '20:30:00',
  recurrenceIntervalWeeks: 2,
  groupCount: 4,
  slotsPerGroup: 4,
  signupMode: SignupMode.DefaultPresent,
  isActive: true,
  raidZones: [zone({ id: 10 })],
  ...overrides,
});

describe('CreateRaidSeriesDialogComponent', () => {
  let seriesStore: { createSeries: ReturnType<typeof vi.fn>; updateSeries: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (existingSeries: RaidSeries | null) => {
    seriesStore = {
      createSeries: vi.fn().mockReturnValue(of(undefined)),
      updateSeries: vi.fn().mockReturnValue(of(undefined)),
    };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    const data: CreateRaidSeriesDialogData = { guildId: 'g1', guildBranchId: 7, series: existingSeries };

    TestBed.configureTestingModule({
      imports: [CreateRaidSeriesDialogComponent],
      providers: [
        { provide: RaidSeriesStore, useValue: seriesStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: TranslocoService, useValue: { activeLang: signal('fr'), translate: vi.fn((key: string) => key) } },
      ],
    }).overrideComponent(CreateRaidSeriesDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(CreateRaidSeriesDialogComponent).componentInstance;
  };

  // ── initial state ────────────────────────────────────────────────────────

  describe('create mode (no existing series)', () => {
    it('is not edit mode', () => {
      expect(setup(null).isEditMode).toBe(false);
    });

    it('defaults every field', () => {
      const component = setup(null);

      expect(component.name()).toBe('');
      expect(component.recurrenceDayOfWeek()).toBe('Tuesday');
      expect(component.startTime()).toBe('21:00');
      expect(component.recurrenceIntervalWeeks()).toBe(1);
      expect(component.groupCount()).toBe(5);
      expect(component.slotsPerGroup()).toBe(5);
      expect(component.selectedZoneIds()).toEqual(new Set());
    });

    it('loads the raid zones for the guild branch', () => {
      setup(null);
      expect(zoneStore.load).toHaveBeenCalledWith('g1', 7);
    });
  });

  describe('edit mode (existing series)', () => {
    it('is edit mode', () => {
      expect(setup(series()).isEditMode).toBe(true);
    });

    it('pre-fills every field from the series', () => {
      const component = setup(series());

      expect(component.name()).toBe('SSC/TK/Gruul');
      expect(component.recurrenceDayOfWeek()).toBe('Wednesday');
      expect(component.startTime()).toBe('20:30');
      expect(component.recurrenceIntervalWeeks()).toBe(2);
      expect(component.groupCount()).toBe(4);
      expect(component.slotsPerGroup()).toBe(4);
      expect(component.selectedZoneIds()).toEqual(new Set([10]));
    });
  });

  // ── dayOptions ───────────────────────────────────────────────────────────

  describe('dayOptions', () => {
    it('lists all 7 weekdays', () => {
      const component = setup(null);
      expect(component.dayOptions()).toHaveLength(7);
      expect(component.dayOptions()[0]).toEqual({ value: 'Monday', label: 'raidBuilder.weekday.Monday' });
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is true for a valid pre-filled edit form', () => {
      expect(setup(series()).canSubmit()).toBe(true);
    });

    it('is false with the default empty create form (no zone selected)', () => {
      expect(setup(null).canSubmit()).toBe(false);
    });

    it('is false while submitting', () => {
      const component = setup(series());
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when the name is blank', () => {
      const component = setup(series());
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when groupCount is not positive', () => {
      const component = setup(series());
      component.groupCount.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when slotsPerGroup is not positive', () => {
      const component = setup(series());
      component.slotsPerGroup.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when recurrenceIntervalWeeks is not positive', () => {
      const component = setup(series());
      component.recurrenceIntervalWeeks.set(0);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup(null);
      component.submit();
      expect(seriesStore.createSeries).not.toHaveBeenCalled();
      expect(seriesStore.updateSeries).not.toHaveBeenCalled();
    });

    it('creates a new series with the built payload in create mode', () => {
      const component = setup(null);
      component.name.set('  New Series  ');
      component.selectedZoneIds.set(new Set([10]));
      component.startTime.set('20:00');

      component.submit();

      expect(seriesStore.createSeries).toHaveBeenCalledWith('g1', 7, {
        name: 'New Series',
        recurrenceDayOfWeek: 'Tuesday',
        recurrenceStartTimeLocal: '20:00:00',
        recurrenceIntervalWeeks: 1,
        groupCount: 5,
        slotsPerGroup: 5,
        signupMode: SignupMode.DefaultPresent,
        raidZoneIds: [10],
      });
      expect(seriesStore.updateSeries).not.toHaveBeenCalled();
    });

    it('updates the existing series by id in edit mode', () => {
      const component = setup(series({ id: 9 }));
      component.submit();

      expect(seriesStore.updateSeries).toHaveBeenCalledWith('g1', 7, 9, expect.objectContaining({ name: 'SSC/TK/Gruul' }));
      expect(seriesStore.createSeries).not.toHaveBeenCalled();
    });

    it('shows a success snackbar and closes with true on success', () => {
      const component = setup(series());
      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.seriesDialog.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped error on failure', () => {
      const component = setup(series());
      seriesStore.updateSeries.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidSeriesNotFound' } })));

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidSeriesNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup(null);
      component.cancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
