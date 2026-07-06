import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GuildSettings } from '../models/guild-settings.model';
import { OfficerThreshold } from '../models/officer-threshold.model';
import { RosterMode } from '../models/roster-mode.enum';
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
      const body: GuildSettings = { timezone: 'UTC', rosterMode: RosterMode.Open, minRosterRoleId: null };

      service.updateSettings('guild-1', body).subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/settings'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  // ── updateOfficerThreshold ───────────────────────────────────────────────

  describe('updateOfficerThreshold', () => {
    it('sends PATCH to /guilds/:id/officer-threshold with the threshold body', () => {
      const body: OfficerThreshold = { minOfficerRoleId: 'role-1' };

      service.updateOfficerThreshold('guild-1', body).subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/guilds/guild-1/officer-threshold'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });
});
