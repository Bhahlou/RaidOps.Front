import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { CharacterStore } from './character.store';
import { CharacterService, GetCharactersResponse } from '../services/character.service';
import { SpecService } from '../../../shared/services/spec.service';
import { GuildMembershipService } from '../../guilds/services/guild-membership.service';
import { Character } from '../models/character.model';
import { GuildMembership } from '../../guilds/models/guild-membership.model';
import { EligibleGuild } from '../../guilds/models/eligible-guild.model';
import { GuildEligibility } from '../../guilds/models/guild-eligibility.model';
import { CharacterRank } from '../../guilds/models/character-rank.enum';
import { BnetAccount } from '../models/bnet-account.model';
import { Spec } from '../../../shared/models/spec.model';

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id,
  name: `Char${id}`,
  classId: 1,
  className: 'Warrior',
  classColor: '#C69B3A',
  raceId: 1,
  raceName: 'Human',
  faction: 'ALLIANCE',
  branchName: 'Retail',
  realmName: 'Silvermoon',
  realmSlug: 'silvermoon',
  level: 80,
  itemLevel: null,
  avatarUrl: null,
  guildName: null,
  bnetSpecs: [],
  raidSpecs: [],
  guildMemberships: [],
  ...overrides,
});

const makeMembership = (guildId: string, rank = CharacterRank.Main): GuildMembership => ({
  guildId,
  guildName: `Guild ${guildId}`,
  guildIconHash: null,
  characterRank: rank,
  joinedAt: '2025-01-01',
});

const mockAccount: BnetAccount = {
  bnetId: '123',
  battleTag: 'User#1234',
  region: 'eu',
  tokenExpiry: '2025-12-31T00:00:00Z',
};

const envelope = (characters: Character[], bnetAccount: BnetAccount | null = null): GetCharactersResponse => ({
  bnetAccount,
  characters,
});

describe('CharacterStore', () => {
  let store: CharacterStore;
  let charService: {
    getCharacters: ReturnType<typeof vi.fn>;
    deactivateCharacter: ReturnType<typeof vi.fn>;
    resyncCharacter: ReturnType<typeof vi.fn>;
    setRaidSpecs: ReturnType<typeof vi.fn>;
  };
  let specService: { getAll: ReturnType<typeof vi.fn> };
  let membershipService: {
    getEligibleGuilds: ReturnType<typeof vi.fn>;
    getEligibleGuildsBulk: ReturnType<typeof vi.fn>;
    joinGuild: ReturnType<typeof vi.fn>;
    updateRank: ReturnType<typeof vi.fn>;
    leaveGuild: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    charService = {
      getCharacters: vi.fn().mockReturnValue(of(envelope([]))),
      deactivateCharacter: vi.fn(),
      resyncCharacter: vi.fn(),
      setRaidSpecs: vi.fn(),
    };
    specService = { getAll: vi.fn() };
    membershipService = {
      getEligibleGuilds: vi.fn().mockReturnValue(of([])),
      getEligibleGuildsBulk: vi.fn().mockReturnValue(of([])),
      joinGuild: vi.fn().mockReturnValue(of({ message: 'ok' })),
      updateRank: vi.fn().mockReturnValue(of({ message: 'ok' })),
      leaveGuild: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };

    TestBed.configureTestingModule({
      providers: [
        CharacterStore,
        { provide: CharacterService, useValue: charService },
        { provide: SpecService, useValue: specService },
        { provide: GuildMembershipService, useValue: membershipService },
      ],
    });

    store = TestBed.inject(CharacterStore);
  });

  describe('initial state', () => {
    it('bnetAccount is undefined before first load', () => {
      expect(store.bnetAccount()).toBeUndefined();
    });

    it('isBnetLoading is true initially', () => {
      expect(store.isBnetLoading()).toBe(true);
    });

    it('isBnetLinked is false initially', () => {
      expect(store.isBnetLinked()).toBe(false);
    });

    it('characters is undefined before first load', () => {
      expect(store.characters()).toBeUndefined();
    });

    it('isCharactersLoading is true initially', () => {
      expect(store.isCharactersLoading()).toBe(true);
    });

    it('characterList defaults to empty array while loading', () => {
      expect(store.characterList()).toEqual([]);
    });

    it('isEligibleLoading is true', () => expect(store.isEligibleLoading(1)).toBe(true));
    it('eligibleGuildList defaults to []', () => expect(store.eligibleGuildList(1)).toEqual([]));
    it('joiningGuildId is null', () => expect(store.joiningGuildId()).toBeNull());
    it('joiningCharacterId is null', () => expect(store.joiningCharacterId()).toBeNull());
    it('leavingGuildId is null', () => expect(store.leavingGuildId()).toBeNull());
    it('leavingCharacterId is null', () => expect(store.leavingCharacterId()).toBeNull());
    it('updatingRankCharacterId is null', () => expect(store.updatingRankCharacterId()).toBeNull());
    it('updatingRankGuildId is null', () => expect(store.updatingRankGuildId()).toBeNull());
  });

  describe('loadCharacters', () => {
    it('populates the character list and bnet account, and clears loading state', () => {
      const chars = [makeChar(1), makeChar(2)];
      charService.getCharacters.mockReturnValue(of(envelope(chars, mockAccount)));
      store.loadCharacters().subscribe();

      expect(store.characters()).toEqual(chars);
      expect(store.characterList()).toEqual(chars);
      expect(store.isCharactersLoading()).toBe(false);
      expect(store.bnetAccount()).toEqual(mockAccount);
      expect(store.isBnetLinked()).toBe(true);
    });

    it('sets bnetAccount to null when no account is linked', () => {
      charService.getCharacters.mockReturnValue(of(envelope([], null)));
      store.loadCharacters().subscribe();

      expect(store.bnetAccount()).toBeNull();
      expect(store.isBnetLinked()).toBe(false);
    });

    it('does not refetch on a second call (cached)', () => {
      const chars = [makeChar(1)];
      charService.getCharacters.mockReturnValue(of(envelope(chars)));
      store.loadCharacters().subscribe();
      store.loadCharacters().subscribe();

      expect(charService.getCharacters).toHaveBeenCalledTimes(1);
    });

    it('refetches when force is true even if already cached', () => {
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1)])));
      store.loadCharacters().subscribe();

      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1), makeChar(2)])));
      store.loadCharacters(true).subscribe();

      expect(charService.getCharacters).toHaveBeenCalledTimes(2);
      expect(store.characterList()).toHaveLength(2);
    });
  });

  describe('deactivateCharacter', () => {
    it('removes the deactivated character from the local list', () => {
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1), makeChar(2), makeChar(3)])));
      store.loadCharacters().subscribe();

      charService.deactivateCharacter.mockReturnValue(of({ message: 'ok' }));
      store.deactivateCharacter(2).subscribe();

      expect(store.characterList()).toEqual([makeChar(1), makeChar(3)]);
    });

    it('leaves the characters signal as undefined when list has not been loaded yet', () => {
      charService.deactivateCharacter.mockReturnValue(of({ message: 'ok' }));
      store.deactivateCharacter(1).subscribe();

      expect(store.characters()).toBeUndefined();
    });
  });

  describe('resyncCharacter', () => {
    it('replaces the resynced character in the local list', () => {
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1), makeChar(2)])));
      store.loadCharacters().subscribe();

      const updated: Character = { ...makeChar(1), name: 'UpdatedName' };
      charService.resyncCharacter.mockReturnValue(of(updated));
      store.resyncCharacter(1).subscribe();

      expect(store.characterList()).toEqual([updated, makeChar(2)]);
    });

    it('leaves the characters signal as undefined when list has not been loaded yet', () => {
      const updated: Character = { ...makeChar(1), name: 'UpdatedName' };
      charService.resyncCharacter.mockReturnValue(of(updated));
      store.resyncCharacter(1).subscribe();

      expect(store.characters()).toBeUndefined();
    });
  });

  describe('loadSpecs', () => {
    const specs: Spec[] = [
      { id: 71, name: 'Arms', role: 'Dps', classId: 1, iconUrl: 'https://cdn/arms.jpg' },
      { id: 72, name: 'Fury', role: 'Dps', classId: 1, iconUrl: null },
    ];

    it('fetches and caches the spec list', () => {
      specService.getAll.mockReturnValue(of(specs));
      store.loadSpecs().subscribe();

      expect(store.specs()).toEqual(specs);
    });

    it('does not refetch on subsequent calls', () => {
      specService.getAll.mockReturnValue(of(specs));
      store.loadSpecs().subscribe();
      store.loadSpecs().subscribe();

      expect(specService.getAll).toHaveBeenCalledTimes(1);
    });

    it('returns the cached list on subsequent calls', () => {
      specService.getAll.mockReturnValue(of(specs));
      store.loadSpecs().subscribe();

      let result: Spec[] | undefined;
      store.loadSpecs().subscribe((s) => (result = s));

      expect(result).toEqual(specs);
    });
  });

  describe('setRaidSpecs', () => {
    const specs: Spec[] = [
      { id: 71, name: 'Arms', role: 'Dps', classId: 1, iconUrl: 'https://cdn/arms.jpg' },
      { id: 72, name: 'Fury', role: 'Dps', classId: 1, iconUrl: null },
    ];

    it('patches the character with enriched raid specs using cached spec data', () => {
      specService.getAll.mockReturnValue(of(specs));
      store.loadSpecs().subscribe();

      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1), makeChar(2)])));
      store.loadCharacters().subscribe();

      charService.setRaidSpecs.mockReturnValue(of({ message: 'ok' }));
      store.setRaidSpecs(1, { mainSpecId: 72, viableSpecIds: [71, 72] }).subscribe();

      const updated = store.characterList().find((c) => c.id === 1);
      expect(updated?.raidSpecs).toEqual([
        { specId: 71, name: 'Arms', iconUrl: 'https://cdn/arms.jpg', isMain: false },
        { specId: 72, name: 'Fury', iconUrl: null, isMain: true },
      ]);
      expect(store.characterList().find((c) => c.id === 2)?.raidSpecs).toEqual([]);
    });

    it('skips spec ids that are not in the cached reference data', () => {
      specService.getAll.mockReturnValue(of([specs[0]])); // only 71 cached
      store.loadSpecs().subscribe();

      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1)])));
      store.loadCharacters().subscribe();

      charService.setRaidSpecs.mockReturnValue(of({ message: 'ok' }));
      store.setRaidSpecs(1, { mainSpecId: 71, viableSpecIds: [71, 999] }).subscribe();

      expect(store.characterList()[0].raidSpecs).toEqual([
        { specId: 71, name: 'Arms', iconUrl: 'https://cdn/arms.jpg', isMain: true },
      ]);
    });

    it('leaves the characters signal as undefined when list has not been loaded yet', () => {
      charService.setRaidSpecs.mockReturnValue(of({ message: 'ok' }));
      store.setRaidSpecs(1, { mainSpecId: 71, viableSpecIds: [71] }).subscribe();

      expect(store.characters()).toBeUndefined();
    });
  });

  describe('loadEligibleGuilds', () => {
    it('populates eligibleGuildList on success', () => {
      const data: EligibleGuild[] = [{ guildId: 'g2', guildName: 'Guild g2', guildIconHash: null }];
      membershipService.getEligibleGuilds.mockReturnValue(of(data));
      store.loadEligibleGuilds(1);

      expect(store.eligibleGuildList(1)).toEqual(data);
      expect(store.isEligibleLoading(1)).toBe(false);
    });

    it('resets eligibleGuildList to [] on error', () => {
      membershipService.getEligibleGuilds.mockReturnValue(throwError(() => new Error('fail')));
      store.loadEligibleGuilds(1);

      expect(store.eligibleGuildList(1)).toEqual([]);
    });

    it('keeps each character its own eligible list — loading one does not leak into another', () => {
      membershipService.getEligibleGuilds.mockReturnValue(
        of([{ guildId: 'g1', guildName: 'Guild g1', guildIconHash: null }]),
      );
      store.loadEligibleGuilds(1);

      membershipService.getEligibleGuilds.mockReturnValue(
        of([{ guildId: 'g2', guildName: 'Guild g2', guildIconHash: null }]),
      );
      store.loadEligibleGuilds(2);

      expect(store.eligibleGuildList(1).map((g) => g.guildId)).toEqual(['g1']);
      expect(store.eligibleGuildList(2).map((g) => g.guildId)).toEqual(['g2']);
    });
  });

  describe('clearEligibleGuilds', () => {
    it('resets eligibleGuildList to loading state for that character only', () => {
      membershipService.getEligibleGuilds.mockReturnValue(of([{ guildId: 'g1', guildName: 'Guild g1', guildIconHash: null }]));
      store.loadEligibleGuilds(1);
      store.loadEligibleGuilds(2);

      store.clearEligibleGuilds(1);

      expect(store.isEligibleLoading(1)).toBe(true);
      expect(store.isEligibleLoading(2)).toBe(false);
    });
  });

  describe('joinGuild', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      membershipService.joinGuild.mockReturnValue(subject.asObservable());
      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(store.joiningGuildId()).toBe('g1');
      expect(store.joiningCharacterId()).toBe(1);

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.joiningGuildId()).toBeNull();
      expect(store.joiningCharacterId()).toBeNull();
    });

    it('force-reloads the character list after success', () => {
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1)])));
      store.loadCharacters().subscribe();
      charService.getCharacters.mockClear();
      charService.getCharacters.mockReturnValue(
        of(envelope([makeChar(1, { guildMemberships: [makeMembership('g1')] })])),
      );

      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(charService.getCharacters).toHaveBeenCalledTimes(1);
      expect(store.characterList()[0].guildMemberships).toEqual([makeMembership('g1')]);
    });

    it('removes the joined guild from that character eligibleGuildList', () => {
      membershipService.getEligibleGuilds.mockReturnValue(
        of([{ guildId: 'g1', guildName: 'Guild g1', guildIconHash: null }, { guildId: 'g2', guildName: 'Guild g2', guildIconHash: null }]),
      );
      store.loadEligibleGuilds(1);

      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(store.eligibleGuildList(1).map((g) => g.guildId)).toEqual(['g2']);
    });

    it('clears spinners and re-throws on error', () => {
      membershipService.joinGuild.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.joiningGuildId()).toBeNull();
      expect(store.joiningCharacterId()).toBeNull();
    });
  });

  describe('updateRank', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      membershipService.updateRank.mockReturnValue(subject.asObservable());
      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      expect(store.updatingRankCharacterId()).toBe(1);
      expect(store.updatingRankGuildId()).toBe('g1');

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.updatingRankCharacterId()).toBeNull();
      expect(store.updatingRankGuildId()).toBeNull();
    });

    it('updates the matching membership rank in the local cache', () => {
      charService.getCharacters.mockReturnValue(
        of(envelope([makeChar(1, { guildMemberships: [makeMembership('g1'), makeMembership('g2')] })])),
      );
      store.loadCharacters().subscribe();

      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      const memberships = store.characterList()[0].guildMemberships;
      expect(memberships.find((m) => m.guildId === 'g1')?.characterRank).toBe(CharacterRank.Alt);
      expect(memberships.find((m) => m.guildId === 'g2')?.characterRank).toBe(CharacterRank.Main);
    });

    it('does not affect other characters', () => {
      charService.getCharacters.mockReturnValue(
        of(envelope([
          makeChar(1, { guildMemberships: [makeMembership('g1')] }),
          makeChar(2, { guildMemberships: [makeMembership('g1')] }),
        ])),
      );
      store.loadCharacters().subscribe();

      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      expect(store.characterList().find((c) => c.id === 2)?.guildMemberships[0].characterRank).toBe(CharacterRank.Main);
    });

    it('clears spinners and re-throws on error', () => {
      membershipService.updateRank.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.updatingRankCharacterId()).toBeNull();
      expect(store.updatingRankGuildId()).toBeNull();
    });
  });

  describe('leaveGuild', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      membershipService.leaveGuild.mockReturnValue(subject.asObservable());
      store.leaveGuild(1, 'g1').subscribe();

      expect(store.leavingGuildId()).toBe('g1');
      expect(store.leavingCharacterId()).toBe(1);

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.leavingGuildId()).toBeNull();
      expect(store.leavingCharacterId()).toBeNull();
    });

    it('removes the guild from the character local cache', () => {
      charService.getCharacters.mockReturnValue(
        of(envelope([makeChar(1, { guildMemberships: [makeMembership('g1'), makeMembership('g2')] })])),
      );
      store.loadCharacters().subscribe();

      store.leaveGuild(1, 'g1').subscribe();

      expect(store.characterList()[0].guildMemberships.map((m) => m.guildId)).toEqual(['g2']);
    });

    it('clears spinners and re-throws on error', () => {
      membershipService.leaveGuild.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.leaveGuild(1, 'g1').subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.leavingGuildId()).toBeNull();
      expect(store.leavingCharacterId()).toBeNull();
    });
  });

  describe('loadEligibleGuildsBulk / eligibleGuildsBulk', () => {
    const bulkGuild: GuildEligibility = {
      guildId: 'g1',
      guildName: 'Test Guild',
      guildIconHash: null,
      eligibleCharacters: [{ id: 1, name: 'Char1', classId: 1, className: 'Warrior', classColor: '#C69B3A' }],
    };

    it('isEligibleBulkLoading is true before loadEligibleGuildsBulk is called', () => {
      expect(store.isEligibleBulkLoading()).toBe(true);
    });

    it('eligibleGuildsBulk defaults to [] while loading', () => {
      expect(store.eligibleGuildsBulk()).toEqual([]);
    });

    it('populates eligibleGuildsBulk on success', () => {
      membershipService.getEligibleGuildsBulk.mockReturnValue(of([bulkGuild]));
      store.loadEligibleGuildsBulk();

      expect(store.eligibleGuildsBulk()).toEqual([bulkGuild]);
      expect(store.isEligibleBulkLoading()).toBe(false);
    });

    it('resets eligibleGuildsBulk to [] on error', () => {
      membershipService.getEligibleGuildsBulk.mockReturnValue(throwError(() => new Error('fail')));
      store.loadEligibleGuildsBulk();

      expect(store.eligibleGuildsBulk()).toEqual([]);
      expect(store.isEligibleBulkLoading()).toBe(false);
    });

    it('resets to loading state at the start of each call', () => {
      membershipService.getEligibleGuildsBulk.mockReturnValue(of([bulkGuild]));
      store.loadEligibleGuildsBulk();
      expect(store.isEligibleBulkLoading()).toBe(false);

      // second call should briefly set loading again (synchronously before subscribe resolves)
      const subject = new Subject<GuildEligibility[]>();
      membershipService.getEligibleGuildsBulk.mockReturnValue(subject.asObservable());
      store.loadEligibleGuildsBulk();
      expect(store.isEligibleBulkLoading()).toBe(true);
    });
  });

  describe('joinGuildBulk', () => {
    const bulkGuild: GuildEligibility = {
      guildId: 'g1',
      guildName: 'Test Guild',
      guildIconHash: null,
      eligibleCharacters: [{ id: 1, name: 'Char1', classId: 1, className: 'Warrior', classColor: '#C69B3A' }],
    };

    it('removes the joined guild from eligibleGuildsBulk on success', () => {
      membershipService.getEligibleGuildsBulk.mockReturnValue(of([bulkGuild]));
      store.loadEligibleGuildsBulk();
      expect(store.eligibleGuildsBulk()).toHaveLength(1);

      charService.getCharacters.mockReturnValue(of(envelope([])));
      store.joinGuildBulk('g1', [{ characterId: 1, rank: CharacterRank.Main }]).subscribe();

      expect(store.eligibleGuildsBulk()).toEqual([]);
    });

    it('force-reloads the character list after success', () => {
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1)])));
      store.loadCharacters().subscribe();
      charService.getCharacters.mockClear();
      charService.getCharacters.mockReturnValue(of(envelope([makeChar(1, { guildMemberships: [makeMembership('g1')] })])));

      store.joinGuildBulk('g1', [{ characterId: 1, rank: CharacterRank.Main }]).subscribe();

      expect(charService.getCharacters).toHaveBeenCalledTimes(1);
    });

    it('re-throws on error without modifying eligibleGuildsBulk', () => {
      membershipService.getEligibleGuildsBulk.mockReturnValue(of([bulkGuild]));
      store.loadEligibleGuildsBulk();

      membershipService.joinGuild.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.joinGuildBulk('g1', [{ characterId: 1, rank: CharacterRank.Main }]).subscribe({
        error: () => { errorCaught = true; },
      });

      expect(errorCaught).toBe(true);
      expect(store.eligibleGuildsBulk()).toEqual([bulkGuild]);
    });
  });

  describe('membershipErrorKey', () => {
    const err = (code: string) => new HttpErrorResponse({ error: { error: code }, status: 400 });

    it.each([
      ['AlreadyMember', 'characterDetail.guilds.errors.alreadyMember'],
      ['NotAMember', 'characterDetail.guilds.errors.notAMember'],
      ['RosterAccessDenied', 'characterDetail.guilds.errors.rosterAccessDenied'],
      ['GuildNotConfigured', 'characterDetail.guilds.errors.guildNotConfigured'],
      ['Forbidden', 'characterDetail.guilds.errors.forbidden'],
      ['GuildBotNotPresent', 'characterDetail.guilds.errors.guildBotNotPresent'],
    ])('maps %s to %s', (code, key) => {
      expect(store.membershipErrorKey(err(code))).toBe(key);
    });

    it('falls back to the generic key for an unmapped code', () => {
      expect(store.membershipErrorKey(err('SomethingUnexpected'))).toBe('characterDetail.guilds.errors.generic');
    });

    it('falls back to the generic key when the error body has no code', () => {
      expect(store.membershipErrorKey(new HttpErrorResponse({ status: 500 }))).toBe('characterDetail.guilds.errors.generic');
    });
  });
});
