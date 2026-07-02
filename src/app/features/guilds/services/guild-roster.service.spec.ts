import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GuildRosterService } from './guild-roster.service';
import { GuildRosterMember } from '../models/guild-roster-member.model';
import { CharacterRank } from '../models/character-rank.enum';

const member: GuildRosterMember = {
  characterId: 1,
  characterName: 'Arthas',
  classId: 6,
  className: 'Death Knight',
  classColor: '#C41F3B',
  level: 80,
  branchName: 'Classic Anniversary',
  realmSlug: 'kazzak',
  avatarUrl: null,
  playerDiscordId: 'user-1',
  playerName: 'Bhahlou',
  playerAvatarHash: null,
  raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: true }],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
};

describe('GuildRosterService', () => {
  let service: GuildRosterService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GuildRosterService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getRoster', () => {
    it('sends GET /guilds/:guildId/roster and returns the list', () => {
      let result: GuildRosterMember[] | undefined;
      service.getRoster('g1').subscribe(m => { result = m; });

      const req = controller.expectOne(r => r.url.endsWith('/guilds/g1/roster'));
      expect(req.request.method).toBe('GET');
      req.flush([member]);

      expect(result).toEqual([member]);
    });
  });
});
