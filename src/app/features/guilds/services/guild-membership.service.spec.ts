import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GuildMembershipService } from './guild-membership.service';
import { GuildMembership } from '../models/guild-membership.model';
import { EligibleGuild } from '../models/eligible-guild.model';
import { CharacterInGuild } from '../models/character-in-guild.model';
import { CharacterRank } from '../models/character-rank.enum';

const membership: GuildMembership = {
  guildId: 'g1', guildName: 'Epic Guild', guildIconHash: null,
  characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
};

const eligible: EligibleGuild = { guildId: 'g2', guildName: 'Other Guild', guildIconHash: null };

const charInGuild: CharacterInGuild = {
  characterId: 1, name: 'Char1', realmName: 'Thunderstrike',
  className: 'Druid', classColor: '#FF7C0A', avatarUrl: null,
  guildName: 'Epic Guild', characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
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

  // ── getCharacterMemberships ───────────────────────────────────────────────

  describe('getCharacterMemberships', () => {
    it('sends GET /characters/:id/memberships and returns the list', () => {
      let result: GuildMembership[] | undefined;
      service.getCharacterMemberships(1).subscribe(m => { result = m; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/1/memberships'));
      expect(req.request.method).toBe('GET');
      req.flush([membership]);

      expect(result).toEqual([membership]);
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

  // ── getMyCharactersInGuild ────────────────────────────────────────────────

  describe('getMyCharactersInGuild', () => {
    it('sends GET /guilds/:guildId/my-characters and returns the list', () => {
      let result: CharacterInGuild[] | undefined;
      service.getMyCharactersInGuild('g1').subscribe(c => { result = c; });

      const req = controller.expectOne(r => r.url.endsWith('/guilds/g1/my-characters'));
      expect(req.request.method).toBe('GET');
      req.flush([charInGuild]);

      expect(result).toEqual([charInGuild]);
    });
  });
});
