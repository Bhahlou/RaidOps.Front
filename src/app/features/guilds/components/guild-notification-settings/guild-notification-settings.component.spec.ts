import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildNotificationSettingsComponent } from './guild-notification-settings.component';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildNotificationSettingsStore } from '../../stores/guild-notification-settings.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildNotificationEventType, GuildNotificationSetting } from '../../models/guild-notification-setting.model';
import { DiscordChannel } from '../../../../shared/models/discord-channel.model';

const channel = (overrides?: Partial<DiscordChannel>): DiscordChannel => ({
  id: 'chan-1',
  name: 'general',
  botCanSendMessages: true,
  categoryName: null,
  ...overrides,
});

const setting = (overrides?: Partial<GuildNotificationSetting>): GuildNotificationSetting => ({
  eventType: GuildNotificationEventType.AbsenceAdded,
  enabled: true,
  channelId: 'chan-1',
  ...overrides,
});

describe('GuildNotificationSettingsComponent', () => {
  let fixture: ComponentFixture<GuildNotificationSettingsComponent>;
  let component: GuildNotificationSettingsComponent;
  let settingsService: { updateNotificationSettings: ReturnType<typeof vi.fn> };
  let store: {
    settings: ReturnType<typeof signal<GuildNotificationSetting[]>>;
    channels: ReturnType<typeof signal<DiscordChannel[]>>;
    load: ReturnType<typeof vi.fn>;
    patchSettings: ReturnType<typeof vi.fn>;
  };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let transloco: { translate: ReturnType<typeof vi.fn> };

  const setup = (guildId = 'g1', storeSettings: GuildNotificationSetting[] = [], storeChannels: DiscordChannel[] = [channel()]) => {
    settingsService = { updateNotificationSettings: vi.fn().mockReturnValue(of(undefined)) };
    store = {
      settings: signal<GuildNotificationSetting[]>([]),
      channels: signal<DiscordChannel[]>(storeChannels),
      load: vi.fn(),
      patchSettings: vi.fn(),
    };
    store.load.mockImplementation(() => store.settings.set(storeSettings));
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };
    transloco = { translate: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({
      imports: [GuildNotificationSettingsComponent],
      providers: [
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: GuildNotificationSettingsStore, useValue: store },
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
    it('loads settings for the given guild', () => {
      setup('g1');
      fixture.detectChanges();

      expect(store.load).toHaveBeenCalledWith('g1');
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
    it('sorts channels by category then name and flags channels the bot cannot post in', () => {
      setup('g1', [], [
        channel({ id: 'c2', name: 'bravo', categoryName: 'Zeta', botCanSendMessages: true }),
        channel({ id: 'c1', name: 'alpha', categoryName: 'Alpha', botCanSendMessages: false }),
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

    it('is true when the matching channel cannot receive bot messages', () => {
      setup('g1', [], [channel({ id: 'c1', botCanSendMessages: false })]);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('c1')).toBe(true);
    });

    it('is false when the matching channel can receive bot messages', () => {
      setup('g1', [], [channel({ id: 'c1', botCanSendMessages: true })]);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('c1')).toBe(false);
    });

    it('is false when no channel matches the id', () => {
      setup('g1', [], []);
      fixture.detectChanges();

      expect(component.channelHasNoPermission('missing')).toBe(false);
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

  // ── save ──────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('does nothing when canSave is false', async () => {
      setup('g1', [setting({ enabled: true, channelId: null })]);
      fixture.detectChanges();

      await component.save();

      expect(settingsService.updateNotificationSettings).not.toHaveBeenCalled();
    });

    it('sends every family event row, patches the store, resyncs the user and shows a success snackbar', async () => {
      setup('g1', [setting({ enabled: true, channelId: 'chan-1' })]);
      fixture.detectChanges();

      await component.save();

      expect(settingsService.updateNotificationSettings).toHaveBeenCalledWith('g1', [
        { eventType: GuildNotificationEventType.AbsenceAdded, enabled: true, channelId: 'chan-1' },
        { eventType: GuildNotificationEventType.AbsenceRemoved, enabled: false, channelId: null },
      ]);
      expect(store.patchSettings).toHaveBeenCalled();
      expect(authStore.loadUser).toHaveBeenCalledOnce();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.notificationSettings.saveSuccess');
      expect(component.submitting()).toBe(false);
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
