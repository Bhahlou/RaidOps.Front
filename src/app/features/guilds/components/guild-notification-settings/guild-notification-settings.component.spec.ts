import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildNotificationSettingsComponent } from './guild-notification-settings.component';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildNotificationSettingsStore } from '../../stores/guild-notification-settings.store';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildNotificationEventType, GuildNotificationSetting } from '../../models/guild-notification-setting.model';
import { GuildBranch } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { DiscordChannel, DiscordChannelPermissionFlag } from '../../../../shared/models/discord-channel.model';
import { Branch } from '../../../../shared/models/branch.model';

const channel = (overrides?: Partial<DiscordChannel>): DiscordChannel => ({
  id: 'chan-1',
  name: 'general',
  missingPermissions: [],
  categoryName: null,
  ...overrides,
});

const setting = (overrides?: Partial<GuildNotificationSetting>): GuildNotificationSetting => ({
  eventType: GuildNotificationEventType.AbsenceAdded,
  enabled: true,
  channelId: 'chan-1',
  ...overrides,
});

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 1,
  branchName: 'Retail',
  isActive: true,
  rosterMode: RosterMode.Open,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  ...overrides,
});

describe('GuildNotificationSettingsComponent', () => {
  let fixture: ComponentFixture<GuildNotificationSettingsComponent>;
  let component: GuildNotificationSettingsComponent;
  let settingsService: { updateNotificationSettings: ReturnType<typeof vi.fn>; resetNotificationSetting: ReturnType<typeof vi.fn> };
  let store: {
    settings: ReturnType<typeof signal<GuildNotificationSetting[]>>;
    channels: ReturnType<typeof signal<DiscordChannel[]>>;
    load: ReturnType<typeof vi.fn>;
    patchSettings: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let branchesStore: { branches: ReturnType<typeof signal<GuildBranch[]>>; load: ReturnType<typeof vi.fn> };
  let wowBrancheService: { getAll: ReturnType<typeof vi.fn> };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let transloco: { translate: ReturnType<typeof vi.fn> };

  const setup = (
    guildId = 'g1',
    storeSettings: GuildNotificationSetting[] = [],
    storeChannels: DiscordChannel[] = [channel()],
    storeBranches: GuildBranch[] = [branch()],
    wowBranches: Branch[] = [],
  ) => {
    settingsService = {
      updateNotificationSettings: vi.fn().mockReturnValue(of(undefined)),
      resetNotificationSetting: vi.fn().mockReturnValue(of(undefined)),
    };
    store = {
      settings: signal<GuildNotificationSetting[]>([]),
      channels: signal<DiscordChannel[]>(storeChannels),
      load: vi.fn(),
      patchSettings: vi.fn(),
      reload: vi.fn(),
    };
    store.load.mockImplementation(() => store.settings.set(storeSettings));
    branchesStore = { branches: signal<GuildBranch[]>(storeBranches), load: vi.fn() };
    wowBrancheService = { getAll: vi.fn().mockReturnValue(of(wowBranches)) };
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };
    transloco = { translate: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({
      imports: [GuildNotificationSettingsComponent],
      providers: [
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: GuildNotificationSettingsStore, useValue: store },
        { provide: GuildBranchesStore, useValue: branchesStore },
        { provide: WowBrancheService, useValue: wowBrancheService },
        { provide: AuthStore, useValue: authStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(GuildNotificationSettingsComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildNotificationSettingsComponent);
    fixture.componentRef.setInput('guildId', guildId);
    component = fixture.componentInstance;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads settings for the given guild, guild-wide by default', () => {
      setup('g1');
      fixture.detectChanges();

      expect(store.load).toHaveBeenCalledWith('g1', null);
      expect(branchesStore.load).toHaveBeenCalledWith('g1');
    });

    it('populates rows from the store settings', () => {
      setup('g1', [setting({ eventType: GuildNotificationEventType.AbsenceRemoved, enabled: false, channelId: null })]);
      fixture.detectChanges();

      const row = component.row(GuildNotificationEventType.AbsenceRemoved);
      expect(row.enabled).toBe(false);
      expect(row.channelId).toBeNull();
    });
  });

  // ── row ───────────────────────────────────────────────────────────────────

  describe('row', () => {
    it('returns a disabled default row when the event type has no stored setting', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.row(GuildNotificationEventType.AbsenceAdded)).toEqual({
        eventType: GuildNotificationEventType.AbsenceAdded,
        enabled: false,
        channelId: null,
      });
    });
  });

  // ── channelOptions ────────────────────────────────────────────────────────

  describe('channelOptions', () => {
    it('sorts channels by category then name and flags channels with a missing permission', () => {
      setup('g1', [], [
        channel({ id: 'c2', name: 'bravo', categoryName: 'Zeta', missingPermissions: [] }),
        channel({ id: 'c1', name: 'alpha', categoryName: 'Alpha', missingPermissions: [DiscordChannelPermissionFlag.EmbedLinks] }),
      ]);
      fixture.detectChanges();

      expect(component.channelOptions()).toEqual([
        { value: 'c1', label: '⚠️ alpha', group: 'Alpha' },
        { value: 'c2', label: 'bravo', group: 'Zeta' },
      ]);
    });

    it('breaks ties within the same category by channel name', () => {
      setup('g1', [], [
        channel({ id: 'c2', name: 'zulu', categoryName: 'Cat' }),
        channel({ id: 'c1', name: 'alpha', categoryName: 'Cat' }),
      ]);
      fixture.detectChanges();

      expect(component.channelOptions().map((o) => o.value)).toEqual(['c1', 'c2']);
    });

    it('falls back to an undefined group for channels with no category', () => {
      setup('g1', [], [channel({ categoryName: null })]);
      fixture.detectChanges();

      expect(component.channelOptions()[0].group).toBeUndefined();
    });

    it('sorts uncategorized channels (null category) ahead of categorized ones', () => {
      setup('g1', [], [
        channel({ id: 'c2', name: 'zulu', categoryName: 'Cat' }),
        channel({ id: 'c1', name: 'alpha', categoryName: null }),
      ]);
      fixture.detectChanges();

      expect(component.channelOptions().map((o) => o.value)).toEqual(['c1', 'c2']);
    });

    it('sorts uncategorized channels ahead of categorized ones regardless of input order', () => {
      setup('g1', [], [
        channel({ id: 'c1', name: 'alpha', categoryName: null }),
        channel({ id: 'c2', name: 'zulu', categoryName: 'Cat' }),
      ]);
      fixture.detectChanges();

      expect(component.channelOptions().map((o) => o.value)).toEqual(['c1', 'c2']);
    });
  });

  // ── canSave ───────────────────────────────────────────────────────────────

  describe('canSave', () => {
    it('is true when every enabled event has a channel', () => {
      setup('g1', [setting({ enabled: true, channelId: 'chan-1' })]);
      fixture.detectChanges();

      expect(component.canSave()).toBe(true);
    });

    it('is false when an enabled event has no channel', () => {
      setup('g1', [setting({ enabled: true, channelId: null })]);
      fixture.detectChanges();

      expect(component.canSave()).toBe(false);
    });

    it('is true when a disabled event has no channel', () => {
      setup('g1', [setting({ enabled: false, channelId: null })]);
      fixture.detectChanges();

      expect(component.canSave()).toBe(true);
    });

    it('is true when a channelless (DM) event is enabled with no channel', () => {
      setup('g1', [setting({ eventType: GuildNotificationEventType.RaidCompositionAnnouncementDm, enabled: true, channelId: null })]);
      fixture.detectChanges();

      expect(component.canSave()).toBe(true);
    });
  });

  // ── isChannelless ─────────────────────────────────────────────────────────

  describe('isChannelless', () => {
    it('is true for the composition announcement DM event', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.isChannelless(GuildNotificationEventType.RaidCompositionAnnouncementDm)).toBe(true);
    });

    it('is false for a channel-posting event', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.isChannelless(GuildNotificationEventType.RaidCompositionAnnouncementPosted)).toBe(false);
    });
  });

  // ── eventLabel ────────────────────────────────────────────────────────────

  describe('eventLabel', () => {
    it('translates the event type into its i18n key', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.eventLabel(GuildNotificationEventType.AbsenceAdded)).toBeTruthy();
    });
  });

  // ── channelHasNoPermission ────────────────────────────────────────────────

  describe('channelHasNoPermission', () => {
    it('is false when channelId is null', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.channelHasNoPermission(null)).toBe(false);
    });

    it('is true when the matching channel is missing a permission', () => {
      setup('g1', [], [channel({ id: 'c1', missingPermissions: [DiscordChannelPermissionFlag.SendMessages] })]);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('c1')).toBe(true);
    });

    it('is false when the matching channel has no missing permissions', () => {
      setup('g1', [], [channel({ id: 'c1', missingPermissions: [] })]);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('c1')).toBe(false);
    });

    it('is false when no channel matches the id', () => {
      setup('g1', [], []);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('missing')).toBe(false);
    });
  });

  // ── missingPermissionsLabel ───────────────────────────────────────────────

  describe('missingPermissionsLabel', () => {
    it('translates and joins every missing flag for the channel', () => {
      setup('g1', [], [channel({ id: 'c1', missingPermissions: [DiscordChannelPermissionFlag.SendMessages, DiscordChannelPermissionFlag.EmbedLinks] })]);
      fixture.detectChanges();

      expect(component.missingPermissionsLabel('c1')).toBe(
        'guildSettings.notificationSettings.channel.permissionFlags.SendMessages, guildSettings.notificationSettings.channel.permissionFlags.EmbedLinks',
      );
    });

    it('returns an empty string when no channel matches the id', () => {
      setup('g1', [], []);
      fixture.detectChanges();

      expect(component.missingPermissionsLabel('missing')).toBe('');
    });
  });

  // ── channelMissing ────────────────────────────────────────────────────────

  describe('channelMissing', () => {
    it('is true when the event is enabled but has no channel', () => {
      setup('g1', [setting({ enabled: true, channelId: null })]);
      fixture.detectChanges();

      expect(component.channelMissing(GuildNotificationEventType.AbsenceAdded)).toBe(true);
    });

    it('is false when the event is disabled', () => {
      setup('g1', [setting({ enabled: false, channelId: null })]);
      fixture.detectChanges();

      expect(component.channelMissing(GuildNotificationEventType.AbsenceAdded)).toBe(false);
    });

    it('is false for a channelless (DM) event even when enabled with no channel', () => {
      setup('g1', [setting({ eventType: GuildNotificationEventType.RaidCompositionAnnouncementDm, enabled: true, channelId: null })]);
      fixture.detectChanges();

      expect(component.channelMissing(GuildNotificationEventType.RaidCompositionAnnouncementDm)).toBe(false);
    });
  });

  // ── toggleEnabled / setChannel ────────────────────────────────────────────

  describe('toggleEnabled', () => {
    it('updates the enabled flag for the given event', () => {
      setup('g1', [setting({ enabled: false })]);
      fixture.detectChanges();

      component.toggleEnabled(GuildNotificationEventType.AbsenceAdded, true);

      expect(component.row(GuildNotificationEventType.AbsenceAdded).enabled).toBe(true);
    });
  });

  describe('setChannel', () => {
    it('updates the channelId for the given event', () => {
      setup('g1', [setting({ channelId: null })]);
      fixture.detectChanges();

      component.setChannel(GuildNotificationEventType.AbsenceAdded, 'chan-2');

      expect(component.row(GuildNotificationEventType.AbsenceAdded).channelId).toBe('chan-2');
    });
  });

  // ── onScopeChange / scopeOptions / isInherited ────────────────────────────

  describe('scopeOptions', () => {
    it('lists the guild-wide option first, then every active branch, with its expansion icon', () => {
      setup(
        'g1', [], [],
        [branch({ id: 7, branchId: 1, branchName: 'Retail', isActive: true }), branch({ id: 8, branchName: 'Classic', isActive: false })],
        [{ id: 1, name: 'Retail', bnetNamespacePrefix: 'retail', currentExpansionShortCode: 'TWW' }],
      );
      fixture.detectChanges();

      expect(component.scopeOptions()).toEqual([
        { value: '__guild_wide__', label: 'guildSettings.notificationSettings.scope.guildWide' },
        { value: '7', label: 'Retail', iconUrl: '/assets/images/expansion-icons/TWW.png' },
      ]);
    });

    it('falls back to no icon when the branch has no matching WoW branch catalog entry', () => {
      setup('g1', [], [], [branch({ id: 7, branchId: 99, branchName: 'Retail', isActive: true })], []);
      fixture.detectChanges();

      expect(component.scopeOptions()[1]).toEqual({ value: '7', label: 'Retail', iconUrl: null });
    });
  });

  describe('onScopeChange', () => {
    it('switches scope to the given branch and reloads the store for it', () => {
      setup('g1');
      fixture.detectChanges();
      store.load.mockClear();

      component.onScopeChange('7');

      expect(store.load).toHaveBeenCalledWith('g1', 7);
    });

    it('falls back to the guild-wide scope when given null', () => {
      setup('g1');
      fixture.detectChanges();
      component.onScopeChange('7');
      store.load.mockClear();

      component.onScopeChange(null);

      expect(store.load).toHaveBeenCalledWith('g1', null);
    });
  });

  describe('isInherited', () => {
    it('is false for the guild-wide scope', () => {
      setup('g1', [setting({ guildBranchId: null })]);
      fixture.detectChanges();

      expect(component.isInherited(GuildNotificationEventType.AbsenceAdded)).toBe(false);
    });

    it('is true once a branch is selected and the row has no explicit override for it', () => {
      setup('g1', [setting({ guildBranchId: null })]);
      fixture.detectChanges();

      component.onScopeChange('7');

      expect(component.isInherited(GuildNotificationEventType.AbsenceAdded)).toBe(true);
    });

    it('is false once a branch is selected and the row is an explicit override for it', () => {
      setup('g1', [setting({ guildBranchId: 7 })]);
      fixture.detectChanges();

      component.onScopeChange('7');

      expect(component.isInherited(GuildNotificationEventType.AbsenceAdded)).toBe(false);
    });
  });

  // ── resetToInherited ──────────────────────────────────────────────────────

  describe('resetToInherited', () => {
    it('does nothing for the guild-wide scope', async () => {
      setup('g1');
      fixture.detectChanges();

      await component.resetToInherited(GuildNotificationEventType.AbsenceAdded);

      expect(settingsService.resetNotificationSetting).not.toHaveBeenCalled();
    });

    it('resets the branch override, reloads the store and shows a success snackbar', async () => {
      setup('g1');
      fixture.detectChanges();
      component.onScopeChange('7');

      await component.resetToInherited(GuildNotificationEventType.AbsenceAdded);

      expect(settingsService.resetNotificationSetting).toHaveBeenCalledWith('g1', 7, GuildNotificationEventType.AbsenceAdded);
      expect(store.reload).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.notificationSettings.scope.resetSuccess');
      expect(component.resetting()).toBeNull();
    });

    it('shows an error snackbar and clears resetting on failure', async () => {
      setup('g1');
      settingsService.resetNotificationSetting.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();
      component.onScopeChange('7');

      await component.resetToInherited(GuildNotificationEventType.AbsenceAdded);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.resetting()).toBeNull();
    });
  });

  // ── families / accordion (isFamilyExpanded, toggleFamily, enabledCount) ────

  describe('families', () => {
    it('declares Absences, Raid changes, Raid composition changes, Raid composition announcement and Raid signup call, in that order', () => {
      setup('g1');
      fixture.detectChanges();

      expect(component.families.map((f) => f.id)).toEqual([
        'absences',
        'raids',
        'raidComposition',
        'raidCompositionAnnouncement',
        'raidSignupCall',
      ]);
    });

    it('groups the raid event types under "raids" and the composition ones under "raidComposition"', () => {
      setup('g1');
      fixture.detectChanges();

      const raids = component.families.find((f) => f.id === 'raids')!;
      const raidComposition = component.families.find((f) => f.id === 'raidComposition')!;

      expect(raids.eventTypes).toEqual([
        GuildNotificationEventType.RaidPublished,
        GuildNotificationEventType.RaidCancelled,
        GuildNotificationEventType.RaidRescheduled,
      ]);
      expect(raidComposition.eventTypes).toEqual([
        GuildNotificationEventType.RaidSlotAssigned,
        GuildNotificationEventType.RaidSlotUnassigned,
        GuildNotificationEventType.RaidSlotsSwapped,
        GuildNotificationEventType.RaidSlotSpecChanged,
      ]);
    });

    it('groups the composition announcement event types under "raidCompositionAnnouncement"', () => {
      setup('g1');
      fixture.detectChanges();

      const raidCompositionAnnouncement = component.families.find((f) => f.id === 'raidCompositionAnnouncement')!;

      expect(raidCompositionAnnouncement.eventTypes).toEqual([
        GuildNotificationEventType.RaidCompositionAnnouncementPosted,
        GuildNotificationEventType.RaidCompositionAnnouncementDm,
      ]);
    });
  });

  describe('isFamilyExpanded / toggleFamily', () => {
    it('starts every family collapsed', () => {
      setup('g1');
      fixture.detectChanges();

      for (const family of component.families) {
        expect(component.isFamilyExpanded(family.id)).toBe(false);
      }
    });

    it('expands only the toggled family, leaving the others collapsed', () => {
      setup('g1');
      fixture.detectChanges();

      component.toggleFamily('raids', true);

      expect(component.isFamilyExpanded('raids')).toBe(true);
      expect(component.isFamilyExpanded('absences')).toBe(false);
      expect(component.isFamilyExpanded('raidComposition')).toBe(false);
    });

    it('collapses a family back when toggled with false', () => {
      setup('g1');
      fixture.detectChanges();
      component.toggleFamily('raids', true);

      component.toggleFamily('raids', false);

      expect(component.isFamilyExpanded('raids')).toBe(false);
    });

    it('tracks multiple expanded families independently', () => {
      setup('g1');
      fixture.detectChanges();

      component.toggleFamily('raids', true);
      component.toggleFamily('raidComposition', true);

      expect(component.isFamilyExpanded('raids')).toBe(true);
      expect(component.isFamilyExpanded('raidComposition')).toBe(true);
      expect(component.isFamilyExpanded('absences')).toBe(false);
    });
  });

  describe('enabledCount', () => {
    it('counts zero when no event in the family is enabled', () => {
      setup('g1', []);
      fixture.detectChanges();

      const raids = component.families.find((f) => f.id === 'raids')!;
      expect(component.enabledCount(raids)).toBe(0);
    });

    it('counts only the enabled event types within that family', () => {
      setup('g1', [
        setting({ eventType: GuildNotificationEventType.RaidPublished, enabled: true, channelId: 'chan-1' }),
        setting({ eventType: GuildNotificationEventType.RaidCancelled, enabled: false, channelId: null }),
        // Enabled, but in a different family — must not leak into "raids"'s count.
        setting({ eventType: GuildNotificationEventType.AbsenceAdded, enabled: true, channelId: 'chan-1' }),
      ]);
      fixture.detectChanges();

      const raids = component.families.find((f) => f.id === 'raids')!;
      expect(component.enabledCount(raids)).toBe(1);
    });

    it('counts every event type in the family when all are enabled', () => {
      setup('g1', [
        setting({ eventType: GuildNotificationEventType.RaidSlotAssigned, enabled: true, channelId: 'chan-1' }),
        setting({ eventType: GuildNotificationEventType.RaidSlotUnassigned, enabled: true, channelId: 'chan-1' }),
        setting({ eventType: GuildNotificationEventType.RaidSlotsSwapped, enabled: true, channelId: 'chan-1' }),
        setting({ eventType: GuildNotificationEventType.RaidSlotSpecChanged, enabled: true, channelId: 'chan-1' }),
      ]);
      fixture.detectChanges();

      const raidComposition = component.families.find((f) => f.id === 'raidComposition')!;
      expect(component.enabledCount(raidComposition)).toBe(4);
    });
  });

  // ── save ──────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('does nothing when canSave is false', async () => {
      setup('g1', [setting({ enabled: true, channelId: null })]);
      fixture.detectChanges();

      await component.save();

      expect(settingsService.updateNotificationSettings).not.toHaveBeenCalled();
    });

    it('sends every family event row for the guild-wide scope, patches the store, resyncs the user and shows a success snackbar', async () => {
      setup('g1', [setting({ enabled: true, channelId: 'chan-1' })]);
      fixture.detectChanges();

      await component.save();

      // 5 families (Absences, Raid changes, Raid composition changes, Raid composition
      // announcement, Raid signup call), 12 event types total — only AbsenceAdded has a stored
      // setting, every other row falls back to its disabled default.
      const expectedRows = [
        { eventType: GuildNotificationEventType.AbsenceAdded, enabled: true, channelId: 'chan-1' },
        { eventType: GuildNotificationEventType.AbsenceRemoved, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidPublished, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidCancelled, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidRescheduled, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidSlotAssigned, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidSlotUnassigned, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidSlotsSwapped, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidSlotSpecChanged, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidCompositionAnnouncementPosted, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidCompositionAnnouncementDm, enabled: false, channelId: null },
        { eventType: GuildNotificationEventType.RaidSignupCallPosted, enabled: false, channelId: null },
      ];
      expect(settingsService.updateNotificationSettings).toHaveBeenCalledWith('g1', null, expectedRows);
      expect(store.patchSettings).toHaveBeenCalledWith(
        'g1', null,
        expectedRows.map((row) => ({ ...row, guildBranchId: null })),
      );
      expect(authStore.loadUser).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.notificationSettings.saveSuccess');
      expect(component.submitting()).toBe(false);
    });

    it('sends the selected branch id when scoped to a branch', async () => {
      setup('g1', [setting({ enabled: true, channelId: 'chan-1' })]);
      fixture.detectChanges();
      component.onScopeChange('7');

      await component.save();

      expect(settingsService.updateNotificationSettings).toHaveBeenCalledWith('g1', 7, expect.anything());
    });

    it('shows an error snackbar and resets submitting on failure', async () => {
      setup('g1', [setting({ enabled: true, channelId: 'chan-1' })]);
      settingsService.updateNotificationSettings.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.save();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
