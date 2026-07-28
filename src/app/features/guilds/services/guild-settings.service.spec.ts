import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GuildSettings } from '../models/guild-settings.model';
import { GuildNotificationEventType, GuildNotificationSetting } from '../models/guild-notification-setting.model';
import { DiscordChannel } from '../../../shared/models/discord-channel.model';
import { DiscordRole } from '../../../shared/models/discord-role.model';
import { GuildSettingsService } from './guild-settings.service';

describe('GuildSettingsService', () => {
  let service: GuildSettingsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildSettingsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service    = TestBed.inject(GuildSettingsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── getDiscordRoles ───────────────────────────────────────────────────────

  describe('getDiscordRoles', () => {
    it('sends GET to /guilds/:id/discord-roles and returns the list', () => {
      const expected: DiscordRole[] = [{ id: 'r1', name: 'Admin', color: 0, iconHash: null }];
      let result: DiscordRole[] | undefined;

      service.getDiscordRoles('guild-1').subscribe(r => (result = r));

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/discord-roles'));
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  // ── updateSettings ────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    it('sends PATCH to /guilds/:id/settings with the settings body', () => {
      const body: GuildSettings = { timezone: 'UTC', language: 'en' };

      service.updateSettings('guild-1', body).subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/settings'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  // ── getNotificationSettings ──────────────────────────────────────────────

  describe('getNotificationSettings', () => {
    it('sends GET to /guilds/:id/notification-settings and returns the list', () => {
      const expected: GuildNotificationSetting[] = [
        { eventType: GuildNotificationEventType.AbsenceAdded, enabled: true, channelId: 'chan-1' },
      ];
      let result: GuildNotificationSetting[] | undefined;

      service.getNotificationSettings('guild-1').subscribe(r => (result = r));

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/notification-settings'));
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  // ── getNotificationChannels ──────────────────────────────────────────────

  describe('getNotificationChannels', () => {
    it('sends GET to /guilds/:id/notification-channels and returns the list', () => {
      const expected: DiscordChannel[] = [{ id: 'chan-1', name: 'general', botCanSendMessages: true, categoryName: null }];
      let result: DiscordChannel[] | undefined;

      service.getNotificationChannels('guild-1').subscribe(r => (result = r));

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/notification-channels'));
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  // ── updateNotificationSettings ───────────────────────────────────────────

  describe('updateNotificationSettings', () => {
    it('sends PATCH to /guilds/:id/notification-settings with the settings wrapped in a body', () => {
      const settings: GuildNotificationSetting[] = [
        { eventType: GuildNotificationEventType.AbsenceAdded, enabled: true, channelId: 'chan-1' },
      ];

      service.updateNotificationSettings('guild-1', settings).subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/notification-settings'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ settings });
      req.flush(null);
    });
  });
});
