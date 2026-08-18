import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CreateRaidSeriesDialogComponent, CreateRaidSeriesDialogData } from './create-raid-series-dialog.component';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { GuildSettingsService } from '../../../settings/services/guild-settings.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidSeries } from '../../models/raid-series.model';
import { RaidZone } from '../../models/raid-zone.model';
import { GuildBranch } from '../../../models/guild-branch.model';
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

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Anniversary',
  isActive: true,
  rosterMode: null,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  signupMode: SignupMode.DefaultPresent,
  ...overrides,
});

describe('CreateRaidSeriesDialogComponent', () => {
  let seriesStore: { createSeries: ReturnType<typeof vi.fn>; updateSeries: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let branchesStore: { branches: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let guildSettingsService: { getNotificationChannels: ReturnType<typeof vi.fn>; getCategories: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (existingSeries: RaidSeries | null, branches: GuildBranch[] = [branch()]) => {
    seriesStore = {
      createSeries: vi.fn().mockReturnValue(of(undefined)),
      updateSeries: vi.fn().mockReturnValue(of(undefined)),
    };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    branchesStore = { branches: signal(branches), load: vi.fn() };
    guildSettingsService = {
      getNotificationChannels: vi.fn().mockReturnValue(of([])),
      getCategories: vi.fn().mockReturnValue(of({ canCreateRootChannel: true, categories: [] })),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    const data: CreateRaidSeriesDialogData = { guildId: 'g1', guildBranchId: 7, series: existingSeries };

    TestBed.configureTestingModule({
      imports: [CreateRaidSeriesDialogComponent],
      providers: [
        { provide: RaidSeriesStore, useValue: seriesStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: GuildBranchesStore, useValue: branchesStore },
        { provide: GuildSettingsService, useValue: guildSettingsService },
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

  // ── signup override ──────────────────────────────────────────────────────

  describe('showSignupOverride', () => {
    it('is true in create mode when the branch default is DefaultPresent', () => {
      expect(setup(null, [branch({ signupMode: SignupMode.DefaultPresent })]).showSignupOverride()).toBe(true);
    });

    it('is false in create mode when the branch default is already Signup', () => {
      expect(setup(null, [branch({ signupMode: SignupMode.Signup })]).showSignupOverride()).toBe(false);
    });

    it('is false in edit mode regardless of the branch default', () => {
      expect(setup(series(), [branch({ signupMode: SignupMode.DefaultPresent })]).showSignupOverride()).toBe(false);
    });

    it('falls back to DefaultPresent when the branch is not found', () => {
      expect(setup(null, []).showSignupOverride()).toBe(true);
    });

    it('falls back to DefaultPresent when the branch has no signupMode configured yet', () => {
      expect(setup(null, [branch({ signupMode: null })]).showSignupOverride()).toBe(true);
    });
  });

  describe('isSignupMode', () => {
    it('is true when the branch default is already Signup', () => {
      expect(setup(null, [branch({ signupMode: SignupMode.Signup })]).isSignupMode()).toBe(true);
    });

    it('is true when the override checkbox is checked', () => {
      const component = setup(null, [branch({ signupMode: SignupMode.DefaultPresent })]);
      component.signupOverride.set(true);
      expect(component.isSignupMode()).toBe(true);
    });

    it('is false with a DefaultPresent branch and no override', () => {
      expect(setup(null, [branch({ signupMode: SignupMode.DefaultPresent })]).isSignupMode()).toBe(false);
    });
  });

  describe('submit — signupModeOverride payload', () => {
    it('sends Signup when the override checkbox is checked', () => {
      const component = setup(null, [branch({ signupMode: SignupMode.DefaultPresent })]);
      component.name.set('New Series');
      component.selectedZoneIds.set(new Set([10]));
      component.signupOverride.set(true);
      component.channelMode.set('existing');
      component.selectedChannelId.set('c1');

      component.submit();

      expect(seriesStore.createSeries).toHaveBeenCalledWith('g1', 7, expect.objectContaining({ signupModeOverride: SignupMode.Signup }));
    });

    it('sends null when the branch default is already Signup (no override checkbox shown)', () => {
      const component = setup(null, [branch({ signupMode: SignupMode.Signup })]);
      component.name.set('New Series');
      component.selectedZoneIds.set(new Set([10]));
      component.channelMode.set('existing');
      component.selectedChannelId.set('c1');

      component.submit();

      expect(seriesStore.createSeries).toHaveBeenCalledWith('g1', 7, expect.objectContaining({ signupModeOverride: null }));
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

    describe('with the channel field shown (Signup-mode create)', () => {
      const readyComponent = () => {
        const component = setup(null, [branch({ signupMode: SignupMode.Signup })]);
        component.name.set('New Series');
        component.selectedZoneIds.set(new Set([10]));
        return component;
      };

      it('is false in "existing" mode with no channel selected', () => {
        const component = readyComponent();
        component.channelMode.set('existing');
        expect(component.canSubmit()).toBe(false);
      });

      it('is true in "existing" mode with a channel selected', () => {
        const component = readyComponent();
        component.channelMode.set('existing');
        component.selectedChannelId.set('c1');
        expect(component.canSubmit()).toBe(true);
      });

      it('is false in "new" mode with no category selected', () => {
        const component = readyComponent();
        component.channelMode.set('new');
        expect(component.canSubmit()).toBe(false);
      });

      it('is false in "new" mode with a category selected but no create permission there', () => {
        const component = readyComponent();
        component.channelMode.set('new');
        component.selectedCategoryId.set('cat1');
        component.canCreateChannelAtSelection.set(false);
        expect(component.canSubmit()).toBe(false);
      });

      it('is true in "new" mode with a category selected and create permission', () => {
        const component = readyComponent();
        component.channelMode.set('new');
        component.selectedCategoryId.set('cat1');
        component.canCreateChannelAtSelection.set(true);
        expect(component.canSubmit()).toBe(true);
      });
    });
  });

  // ── submit — channel payload ─────────────────────────────────────────────

  describe('submit — channel payload', () => {
    it('sends the selected channel id and no category when reusing an existing channel', () => {
      const component = setup(null, [branch({ signupMode: SignupMode.Signup })]);
      component.name.set('New Series');
      component.selectedZoneIds.set(new Set([10]));
      component.channelMode.set('existing');
      component.selectedChannelId.set('c1');

      component.submit();

      expect(seriesStore.createSeries).toHaveBeenCalledWith(
        'g1', 7,
        expect.objectContaining({ dedicatedAnnouncementChannelId: 'c1', dedicatedAnnouncementChannelCategoryId: undefined }),
      );
    });

    it('sends the selected category and no channel id when creating a new channel', () => {
      const component = setup(null, [branch({ signupMode: SignupMode.Signup })]);
      component.name.set('New Series');
      component.selectedZoneIds.set(new Set([10]));
      component.channelMode.set('new');
      component.selectedCategoryId.set('cat1');
      component.canCreateChannelAtSelection.set(true);

      component.submit();

      expect(seriesStore.createSeries).toHaveBeenCalledWith(
        'g1', 7,
        expect.objectContaining({ dedicatedAnnouncementChannelId: undefined, dedicatedAnnouncementChannelCategoryId: 'cat1' }),
      );
    });

    it('sends no channel fields at all in edit mode, even with a signup-mode branch', () => {
      const component = setup(series({ id: 9, signupMode: SignupMode.Signup }), [branch({ signupMode: SignupMode.Signup })]);

      component.submit();

      expect(seriesStore.updateSeries).toHaveBeenCalledWith(
        'g1', 7, 9,
        expect.objectContaining({ dedicatedAnnouncementChannelId: undefined, dedicatedAnnouncementChannelCategoryId: undefined }),
      );
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
        signupModeOverride: null,
        raidZoneIds: [10],
        dedicatedAnnouncementChannelId: null,
        dedicatedAnnouncementChannelCategoryId: undefined,
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
