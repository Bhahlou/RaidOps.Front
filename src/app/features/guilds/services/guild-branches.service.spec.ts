import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GuildBranch, GuildBranchRosterSettings } from '../models/guild-branch.model';
import { RosterMode } from '../models/roster-mode.enum';
import { GuildBranchesService } from './guild-branches.service';

describe('GuildBranchesService', () => {
  let service: GuildBranchesService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildBranchesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GuildBranchesService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── getBranches ───────────────────────────────────────────────────────────

  describe('getBranches', () => {
    it('sends GET to /guilds/:id/branches and returns the list', () => {
      const expected: GuildBranch[] = [
        { id: 1, branchId: 3, branchName: 'Classic Era', isActive: true, rosterMode: RosterMode.Open, rosterRoleIds: [], officerRoleIds: [], region: null },
      ];
      let result: GuildBranch[] | undefined;

      service.getBranches('guild-1').subscribe((r) => (result = r));

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches'));
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  // ── activateBranch ────────────────────────────────────────────────────────

  describe('activateBranch', () => {
    it('sends POST to /guilds/:id/branches with the branchId body', () => {
      service.activateBranch('guild-1', 3).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ branchId: 3 });
      req.flush(null);
    });
  });

  // ── deactivateBranch ──────────────────────────────────────────────────────

  describe('deactivateBranch', () => {
    it('sends DELETE to /guilds/:id/branches/:guildBranchId', () => {
      service.deactivateBranch('guild-1', 7).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches/7'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── updateRosterSettings ──────────────────────────────────────────────────

  describe('updateRosterSettings', () => {
    it('sends PATCH to /guilds/:id/branches/:guildBranchId/roster-settings with the settings body', () => {
      const body: GuildBranchRosterSettings = { rosterMode: RosterMode.DiscordRoleOnly, rosterRoleIds: ['r1'], officerRoleIds: ['r2'] };

      service.updateRosterSettings('guild-1', 7, body).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches/7/roster-settings'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  // ── updateRegion ──────────────────────────────────────────────────────────

  describe('updateRegion', () => {
    it('sends PATCH to /guilds/:id/branches/:guildBranchId/region with the region body', () => {
      service.updateRegion('guild-1', 7, 'eu').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches/7/region'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ region: 'eu' });
      req.flush(null);
    });
  });
});
