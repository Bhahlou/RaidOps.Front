import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GuildMembershipService } from './guild-membership.service';
import { EligibleGuild } from '../models/eligible-guild.model';
import { GuildEligibility } from '../models/guild-eligibility.model';
import { CharacterRank } from '../models/character-rank.enum';

const eligible: EligibleGuild = { guildId: 'g2', guildName: 'Other Guild', guildIconHash: null };

const eligibleBulk: GuildEligibility = {
  guildId: 'g1',
  guildName: 'My Guild',
  guildIconHash: null,
  eligibleCharacters: [{ id: 1, name: 'Char1', classId: 1, className: 'Warrior', classColor: '#C69B3A' }],
};

describe('GuildMembershipService', () => {
  let service: GuildMembershipService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GuildMembershipService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── getEligibleGuildsBulk ─────────────────────────────────────────────────

  describe('getEligibleGuildsBulk', () => {
    it('sends GET /characters/eligible-guilds and returns the list', () => {
      let result: GuildEligibility[] | undefined;
      service.getEligibleGuildsBulk().subscribe(g => { result = g; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/eligible-guilds'));
      expect(req.request.method).toBe('GET');
      req.flush([eligibleBulk]);

      expect(result).toEqual([eligibleBulk]);
    });
  });

  // ── getEligibleGuilds ─────────────────────────────────────────────────────

  describe('getEligibleGuilds', () => {
    it('sends GET /characters/:id/eligible-guilds and returns the list', () => {
      let result: EligibleGuild[] | undefined;
      service.getEligibleGuilds(1).subscribe(g => { result = g; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/1/eligible-guilds'));
      expect(req.request.method).toBe('GET');
      req.flush([eligible]);

      expect(result).toEqual([eligible]);
    });
  });

  // ── joinGuild ─────────────────────────────────────────────────────────────

  describe('joinGuild', () => {
    it('sends POST /characters/:id/memberships/:guildId with the rank in the body', () => {
      let result: { message: string } | undefined;
      service.joinGuild(1, 'g1', CharacterRank.Main).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/1/memberships/g1'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ characterRank: CharacterRank.Main });
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  describe('updateRank', () => {
    it('sends PATCH /characters/:id/memberships/:guildId with the rank in the body', () => {
      let result: { message: string } | undefined;
      service.updateRank(1, 'g1', CharacterRank.Alt).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/1/memberships/g1'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ characterRank: CharacterRank.Alt });
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });

  // ── leaveGuild ────────────────────────────────────────────────────────────

  describe('leaveGuild', () => {
    it('sends DELETE /characters/:id/memberships/:guildId', () => {
      let result: { message: string } | undefined;
      service.leaveGuild(1, 'g1').subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/1/memberships/g1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });
});
