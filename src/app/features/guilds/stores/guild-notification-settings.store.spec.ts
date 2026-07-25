import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DiscordChannel } from '../../../shared/models/discord-channel.model';
import { GuildNotificationEventType, GuildNotificationSetting } from '../models/guild-notification-setting.model';
import { GuildNotificationSettingsStore } from './guild-notification-settings.store';

const setting = (overrides?: Partial<GuildNotificationSetting>): GuildNotificationSetting => ({
  eventType: GuildNotificationEventType.AbsenceAdded,
  enabled: true,
  channelId: 'chan-1',
  ...overrides,
});

const channel = (overrides?: Partial<DiscordChannel>): DiscordChannel => ({
  id: 'chan-1',
  name: 'general',
  botCanSendMessages: true,
  categoryName: null,
  ...overrides,
});

describe('GuildNotificationSettingsStore', () => {
  let store: GuildNotificationSettingsStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildNotificationSettingsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GuildNotificationSettingsStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── settings / channels ──────────────────────────────────────────────────

  describe('settings / channels', () => {
    it('are empty before any load', () => {
      TestBed.tick();
      expect(store.settings()).toEqual([]);
      expect(store.channels()).toEqual([]);
    });
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('fetches settings and channels for the given guild', async () => {
      store.load('g1');
      TestBed.tick();

      const settingsReq = controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-settings'));
      expect(settingsReq.request.method).toBe('GET');
      settingsReq.flush([setting()]);

      const channelsReq = controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-channels'));
      expect(channelsReq.request.method).toBe('GET');
      channelsReq.flush([channel()]);

      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.settings()).toEqual([setting()]);
      expect(store.channels()).toEqual([channel()]);
    });

    it('does not re-fetch for the same guildId', async () => {
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-settings')).flush([]);
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-channels')).flush([]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1');
      TestBed.tick();

      controller.expectNone((r) => r.url.endsWith('/guilds/g1/notification-settings'));
      controller.expectNone((r) => r.url.endsWith('/guilds/g1/notification-channels'));
    });

    it('re-fetches when the guildId changes', async () => {
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-settings')).flush([]);
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-channels')).flush([]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g2');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g2/notification-settings')).flush([setting()]);
      controller.expectOne((r) => r.url.endsWith('/guilds/g2/notification-channels')).flush([]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.settings()).toEqual([setting()]);
    });
  });

  // ── patchSettings ─────────────────────────────────────────────────────────

  describe('patchSettings', () => {
    it('updates settings in place without calling the backend', async () => {
      // patchSettings is only ever called for a guild that's already loaded (post-save), so the
      // guildId signal doesn't actually change value — re-setting it must not re-trigger a fetch.
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-settings')).flush([]);
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/notification-channels')).flush([]);
      await TestBed.inject(ApplicationRef).whenStable();

      const settings = [setting({ enabled: false, channelId: null })];
      store.patchSettings('g1', settings);
      TestBed.tick();

      expect(store.settings()).toEqual(settings);
      controller.expectNone((r) => r.url.endsWith('/guilds/g1/notification-settings'));
      controller.expectNone((r) => r.url.endsWith('/guilds/g1/notification-channels'));
    });
  });
});
