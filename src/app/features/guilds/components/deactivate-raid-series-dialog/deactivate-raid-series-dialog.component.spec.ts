import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { DeactivateRaidSeriesDialogComponent, DeactivateRaidSeriesDialogData } from './deactivate-raid-series-dialog.component';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidSeries } from '../../models/raid-series.model';
import { SignupMode } from '../../models/signup-mode.enum';

const series = (overrides?: Partial<RaidSeries>): RaidSeries => ({
  id: 4,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  recurrenceDayOfWeek: 'Tuesday',
  recurrenceStartTimeLocal: '21:00:00',
  recurrenceIntervalWeeks: 1,
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  isActive: true,
  raidZones: [],
  ...overrides,
});

describe('DeactivateRaidSeriesDialogComponent', () => {
  let seriesStore: { deactivateSeries: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (existingSeries: RaidSeries = series()) => {
    seriesStore = { deactivateSeries: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    const data: DeactivateRaidSeriesDialogData = { guildId: 'g1', guildBranchId: 7, series: existingSeries };

    TestBed.configureTestingModule({
      imports: [DeactivateRaidSeriesDialogComponent],
      providers: [
        { provide: RaidSeriesStore, useValue: seriesStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(DeactivateRaidSeriesDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(DeactivateRaidSeriesDialogComponent).componentInstance;
  };

  // ── confirm ──────────────────────────────────────────────────────────────

  describe('confirm', () => {
    it('deactivates the series without deleting empty occurrences by default', () => {
      const component = setup(series({ id: 9 }));
      component.confirm();

      expect(seriesStore.deactivateSeries).toHaveBeenCalledWith('g1', 7, 9, false);
    });

    it('passes the deleteEmptyOccurrences flag when checked', () => {
      const component = setup(series({ id: 9 }));
      component.deleteEmptyOccurrences.set(true);
      component.confirm();

      expect(seriesStore.deactivateSeries).toHaveBeenCalledWith('g1', 7, 9, true);
    });

    it('shows a success snackbar and closes with true on success', () => {
      const component = setup();
      component.confirm();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.series.deactivateSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped error on failure', () => {
      const component = setup();
      seriesStore.deactivateSeries.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidSeriesNotFound' } })));

      component.confirm();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidSeriesNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup();
      component.cancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
