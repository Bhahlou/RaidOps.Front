import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { CreateRaidEventDialogComponent, CreateRaidEventDialogData } from './create-raid-event-dialog.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { GuildStore } from '../../stores/guild.store';
import { RaidsService } from '../../services/raids.service';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidZone } from '../../models/raid-zone.model';
import { GuildBranch } from '../../models/guild-branch.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { GuildCategories } from '../../../../shared/models/discord-category.model';

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

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 1,
  branchName: 'Classic Anniversary',
  isActive: true,
  rosterMode: null,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  signupMode: SignupMode.DefaultPresent,
  ...overrides,
});

const emptyCategories: GuildCategories = { canCreateRootChannel: true, categories: [] };

describe('CreateRaidEventDialogComponent', () => {
  let boardStore: { createEvent: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let branchesStore: { branches: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let guildStore: { settings: ReturnType<typeof signal>; loadSettings: ReturnType<typeof vi.fn> };
  let raidsService: { createAnnouncementChannel: ReturnType<typeof vi.fn> };
  let guildSettingsService: { getNotificationChannels: ReturnType<typeof vi.fn>; getCategories: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const data: CreateRaidEventDialogData = { guildId: 'g1', guildBranchId: 7 };

  const setup = (branches: GuildBranch[] = [branch()]) => {
    boardStore = { createEvent: vi.fn().mockReturnValue(of(undefined)) };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    branchesStore = { branches: signal(branches), load: vi.fn() };
    guildStore = { settings: signal({ timezone: 'UTC', language: 'en' }), loadSettings: vi.fn() };
    raidsService = {
      createAnnouncementChannel: vi.fn().mockReturnValue(of({ body: { id: '555', name: 'kara-tue', missingPermissions: [], categoryName: null } })),
    };
    guildSettingsService = {
      getNotificationChannels: vi.fn().mockReturnValue(of([])),
      getCategories: vi.fn().mockReturnValue(of(emptyCategories)),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CreateRaidEventDialogComponent],
      providers: [
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: GuildBranchesStore, useValue: branchesStore },
        { provide: GuildStore, useValue: guildStore },
        { provide: RaidsService, useValue: raidsService },
        { provide: GuildSettingsService, useValue: guildSettingsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(CreateRaidEventDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(CreateRaidEventDialogComponent).componentInstance;
  };

  const fillValid = (component: CreateRaidEventDialogComponent) => {
    component.name.set('SSC/TK/Gruul');
    component.startsAtLocal.set('2026-08-05T21:00');
    component.selectedZoneIds.set(new Set([10]));
  };

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads the raid zones for the guild branch', () => {
      setup();
      expect(zoneStore.load).toHaveBeenCalledWith('g1', 7);
    });

    it('loads the guild branches, guild settings, notification channels and categories', () => {
      setup();
      expect(branchesStore.load).toHaveBeenCalledWith('g1');
      expect(guildStore.loadSettings).toHaveBeenCalledWith('g1');
      expect(guildSettingsService.getNotificationChannels).toHaveBeenCalledWith('g1');
      expect(guildSettingsService.getCategories).toHaveBeenCalledWith('g1');
    });
  });

  // ── isSignupMode ─────────────────────────────────────────────────────────

  describe('isSignupMode', () => {
    it('is false when the branch default is DefaultPresent and no override is set', () => {
      const component = setup([branch({ signupMode: SignupMode.DefaultPresent })]);
      expect(component.isSignupMode()).toBe(false);
    });

    it('is true when the branch default is Signup', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      expect(component.isSignupMode()).toBe(true);
    });

    it('is true when the branch default is DefaultPresent but the override checkbox is checked', () => {
      const component = setup([branch({ signupMode: SignupMode.DefaultPresent })]);
      component.signupOverride.set(true);
      expect(component.isSignupMode()).toBe(true);
    });

    it('falls back to DefaultPresent when the branch is not found', () => {
      const component = setup([]);
      expect(component.isSignupMode()).toBe(false);
    });
  });

  // ── guildLanguage ────────────────────────────────────────────────────────

  describe('guildLanguage', () => {
    it('reads the language from the guild settings', () => {
      const component = setup();
      expect(component.guildLanguage()).toBe('en');
    });

    it('falls back to English when the guild settings have not loaded yet', () => {
      const component = setup();
      guildStore.settings.set(null);
      expect(component.guildLanguage()).toBe('en');
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false with the default empty form', () => {
      const component = setup();
      expect(component.canSubmit()).toBe(false);
    });

    it('is true once name, start date and at least one zone are set (DefaultPresent branch)', () => {
      const component = setup();
      fillValid(component);
      expect(component.canSubmit()).toBe(true);
    });

    it('is false when the name is blank/whitespace', () => {
      const component = setup();
      fillValid(component);
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when no zone is selected', () => {
      const component = setup();
      fillValid(component);
      component.selectedZoneIds.set(new Set());
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when groupCount is not positive', () => {
      const component = setup();
      fillValid(component);
      component.groupCount.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when slotsPerGroup is not positive', () => {
      const component = setup();
      fillValid(component);
      component.slotsPerGroup.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false while already submitting', () => {
      const component = setup();
      fillValid(component);
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false in signup mode with "existing" selected and no channel picked', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      fillValid(component);
      expect(component.canSubmit()).toBe(false);
    });

    it('is true in signup mode with "existing" selected once a channel is picked', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      fillValid(component);
      component.selectedChannelId.set('chan-1');
      expect(component.canSubmit()).toBe(true);
    });

    it('is false in signup mode with "new" selected and no name typed', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      fillValid(component);
      component.channelMode.set('new');
      component.newChannelName.set('');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false in signup mode with "new" selected, a name typed, but the bot cannot create there', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      fillValid(component);
      component.channelMode.set('new');
      component.newChannelName.set('kara-tue');
      component.canCreateChannelAtSelection.set(false);
      expect(component.canSubmit()).toBe(false);
    });

    it('is true in signup mode with "new" selected, a name typed, and the bot can create there', () => {
      const component = setup([branch({ signupMode: SignupMode.Signup })]);
      fillValid(component);
      component.channelMode.set('new');
      component.newChannelName.set('kara-tue');
      component.canCreateChannelAtSelection.set(true);
      expect(component.canSubmit()).toBe(true);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', async () => {
      const component = setup();
      await component.submit();
      expect(boardStore.createEvent).not.toHaveBeenCalled();
    });

    it('creates the event with a trimmed name and the selected zones', async () => {
      const component = setup();
      fillValid(component);
      component.name.set('  SSC/TK/Gruul  ');
      component.groupCount.set(4);
      component.slotsPerGroup.set(4);

      await component.submit();

      expect(boardStore.createEvent).toHaveBeenCalledWith('g1', 7, {
        name: 'SSC/TK/Gruul',
        startsAtUtc: new Date('2026-08-05T21:00').toISOString(),
        groupCount: 4,
        slotsPerGroup: 4,
        signupMode: 'DefaultPresent',
        raidZoneIds: [10],
        signupModeOverride: null,
        dedicatedAnnouncementChannelId: null,
        dedicatedAnnouncementChannelIsBotOwned: false,
      });
    });

    it('shows a success snackbar and closes the dialog with true on success', async () => {
      const component = setup();
      fillValid(component);

      await component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.createSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped snackbar error on failure, without closing', async () => {
      const component = setup();
      fillValid(component);
      boardStore.createEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidZoneNotFound' } })));

      await component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidZoneNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    describe('signup mode', () => {
      it('sends signupModeOverride and the picked existing channel', async () => {
        const component = setup([branch({ signupMode: SignupMode.DefaultPresent })]);
        fillValid(component);
        component.signupOverride.set(true);
        component.selectedChannelId.set('chan-1');

        await component.submit();

        expect(boardStore.createEvent).toHaveBeenCalledWith('g1', 7, expect.objectContaining({
          signupModeOverride: 'Signup',
          dedicatedAnnouncementChannelId: 'chan-1',
          dedicatedAnnouncementChannelIsBotOwned: false,
        }));
      });

      it('creates the channel first, then submits with the returned channel id and IsBotOwned true', async () => {
        const component = setup([branch({ signupMode: SignupMode.Signup })]);
        fillValid(component);
        component.channelMode.set('new');
        component.newChannelName.set('kara-tue');
        component.selectedCategoryId.set('cat-1');
        component.canCreateChannelAtSelection.set(true);

        await component.submit();

        expect(raidsService.createAnnouncementChannel).toHaveBeenCalledWith('g1', 7, 'kara-tue', 'cat-1');
        expect(boardStore.createEvent).toHaveBeenCalledWith('g1', 7, expect.objectContaining({
          dedicatedAnnouncementChannelId: '555',
          dedicatedAnnouncementChannelIsBotOwned: true,
        }));
      });

      it('shows an error and never submits the raid when channel creation fails', async () => {
        const component = setup([branch({ signupMode: SignupMode.Signup })]);
        fillValid(component);
        component.channelMode.set('new');
        component.newChannelName.set('kara-tue');
        component.canCreateChannelAtSelection.set(true);
        raidsService.createAnnouncementChannel.mockReturnValue(throwError(() => new Error('403')));

        await component.submit();

        expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.eventDialog.createChannelFailed');
        expect(boardStore.createEvent).not.toHaveBeenCalled();
        expect(component.submitting()).toBe(false);
      });
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
