import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { GuildMembershipStore } from './guild-membership.store';
import { GuildMembershipService } from '../services/guild-membership.service';
import { GuildMembership } from '../models/guild-membership.model';
import { EligibleGuild } from '../models/eligible-guild.model';
import { CharacterInGuild } from '../models/character-in-guild.model';
import { CharacterRank } from '../models/character-rank.enum';

const makeMembership = (guildId: string): GuildMembership => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
  characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

const makeEligible = (guildId: string): EligibleGuild => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
});

const makeCharInGuild = (characterId: number, guildId = 'g1'): CharacterInGuild => ({
  characterId, name: `Char${characterId}`, realmName: 'Thunderstrike',
  className: 'Druid', classColor: '#FF7C0A', avatarUrl: null,
  guildName: `Guild ${guildId}`, characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

describe('GuildMembershipStore', () => {
  let store: GuildMembershipStore;
  let service: {
    getCharacterMemberships: ReturnType<typeof vi.fn>;
    getEligibleGuilds: ReturnType<typeof vi.fn>;
    joinGuild: ReturnType<typeof vi.fn>;
    updateRank: ReturnType<typeof vi.fn>;
    leaveGuild: ReturnType<typeof vi.fn>;
    getMyCharactersInGuild: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getCharacterMemberships: vi.fn().mockReturnValue(of([])),
      getEligibleGuilds: vi.fn().mockReturnValue(of([])),
      joinGuild: vi.fn().mockReturnValue(of({ message: 'ok' })),
      updateRank: vi.fn().mockReturnValue(of({ message: 'ok' })),
      leaveGuild: vi.fn().mockReturnValue(of({ message: 'ok' })),
      getMyCharactersInGuild: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        GuildMembershipStore,
        { provide: GuildMembershipService, useValue: service },
      ],
    });

    store = TestBed.inject(GuildMembershipStore);
  });

  // ── initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('memberships is undefined', () => expect(store.memberships()).toBeUndefined());
    it('isMembershipsLoading is true', () => expect(store.isMembershipsLoading()).toBe(true));
    it('membershipList defaults to []', () => expect(store.membershipList()).toEqual([]));
    it('eligibleGuilds is undefined', () => expect(store.eligibleGuilds()).toBeUndefined());
    it('isEligibleLoading is true', () => expect(store.isEligibleLoading()).toBe(true));
    it('eligibleGuildList defaults to []', () => expect(store.eligibleGuildList()).toEqual([]));
    it('myCharactersInGuild is undefined', () => expect(store.myCharactersInGuild()).toBeUndefined());
    it('isMyCharactersLoading is true', () => expect(store.isMyCharactersLoading()).toBe(true));
    it('myCharacterList defaults to []', () => expect(store.myCharacterList()).toEqual([]));
    it('joiningGuildId is null', () => expect(store.joiningGuildId()).toBeNull());
    it('joiningCharacterId is null', () => expect(store.joiningCharacterId()).toBeNull());
    it('leavingGuildId is null', () => expect(store.leavingGuildId()).toBeNull());
    it('leavingCharacterId is null', () => expect(store.leavingCharacterId()).toBeNull());
    it('updatingRankCharacterId is null', () => expect(store.updatingRankCharacterId()).toBeNull());
    it('updatingRankGuildId is null', () => expect(store.updatingRankGuildId()).toBeNull());
  });

  // ── loadMemberships ───────────────────────────────────────────────────────

  describe('loadMemberships', () => {
    it('populates memberships on success', () => {
      const data = [makeMembership('g1')];
      service.getCharacterMemberships.mockReturnValue(of(data));
      store.loadMemberships(1);
      expect(store.memberships()).toEqual(data);
      expect(store.isMembershipsLoading()).toBe(false);
    });

    it('resets memberships to [] on error', () => {
      service.getCharacterMemberships.mockReturnValue(throwError(() => new Error('fail')));
      store.loadMemberships(1);
      expect(store.memberships()).toEqual([]);
    });
  });

  // ── loadEligibleGuilds ────────────────────────────────────────────────────

  describe('loadEligibleGuilds', () => {
    it('populates eligibleGuilds on success', () => {
      const data = [makeEligible('g2')];
      service.getEligibleGuilds.mockReturnValue(of(data));
      store.loadEligibleGuilds(1);
      expect(store.eligibleGuilds()).toEqual(data);
      expect(store.isEligibleLoading()).toBe(false);
    });

    it('resets eligibleGuilds to [] on error', () => {
      service.getEligibleGuilds.mockReturnValue(throwError(() => new Error('fail')));
      store.loadEligibleGuilds(1);
      expect(store.eligibleGuilds()).toEqual([]);
    });
  });

  // ── clearEligibleGuilds ───────────────────────────────────────────────────

  describe('clearEligibleGuilds', () => {
    it('resets eligibleGuilds to undefined after it was loaded', () => {
      service.getEligibleGuilds.mockReturnValue(of([makeEligible('g1')]));
      store.loadEligibleGuilds(1);
      expect(store.eligibleGuilds()).toBeDefined();

      store.clearEligibleGuilds();

      expect(store.eligibleGuilds()).toBeUndefined();
      expect(store.isEligibleLoading()).toBe(true);
    });
  });

  // ── loadMyCharactersInGuild ───────────────────────────────────────────────

  describe('loadMyCharactersInGuild', () => {
    it('populates myCharactersInGuild on success', () => {
      const data = [makeCharInGuild(1)];
      service.getMyCharactersInGuild.mockReturnValue(of(data));
      store.loadMyCharactersInGuild('g1');
      expect(store.myCharactersInGuild()).toEqual(data);
      expect(store.isMyCharactersLoading()).toBe(false);
    });

    it('resets myCharactersInGuild to [] on error', () => {
      service.getMyCharactersInGuild.mockReturnValue(throwError(() => new Error('fail')));
      store.loadMyCharactersInGuild('g1');
      expect(store.myCharactersInGuild()).toEqual([]);
    });
  });

  // ── joinGuild ─────────────────────────────────────────────────────────────

  describe('joinGuild', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      service.joinGuild.mockReturnValue(subject.asObservable());
      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(store.joiningGuildId()).toBe('g1');
      expect(store.joiningCharacterId()).toBe(1);

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.joiningGuildId()).toBeNull();
      expect(store.joiningCharacterId()).toBeNull();
    });

    it('reloads memberships after success', () => {
      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();
      expect(service.getCharacterMemberships).toHaveBeenCalledWith(1);
    });

    it('removes the joined guild from eligibleGuilds', () => {
      service.getEligibleGuilds.mockReturnValue(of([makeEligible('g1'), makeEligible('g2')]));
      store.loadEligibleGuilds(1);

      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(store.eligibleGuildList().map(g => g.guildId)).toEqual(['g2']);
    });

    it('reloads myCharactersInGuild when the current guild matches', () => {
      service.getMyCharactersInGuild.mockReturnValue(of([]));
      store.loadMyCharactersInGuild('g1');
      service.getMyCharactersInGuild.mockClear();

      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(service.getMyCharactersInGuild).toHaveBeenCalledWith('g1');
    });

    it('does not reload myCharactersInGuild when a different guild is loaded', () => {
      service.getMyCharactersInGuild.mockReturnValue(of([]));
      store.loadMyCharactersInGuild('g2');
      service.getMyCharactersInGuild.mockClear();

      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe();

      expect(service.getMyCharactersInGuild).not.toHaveBeenCalled();
    });

    it('clears spinners and re-throws on error', () => {
      service.joinGuild.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.joinGuild(1, 'g1', CharacterRank.Main).subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.joiningGuildId()).toBeNull();
      expect(store.joiningCharacterId()).toBeNull();
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  describe('updateRank', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      service.updateRank.mockReturnValue(subject.asObservable());
      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      expect(store.updatingRankCharacterId()).toBe(1);
      expect(store.updatingRankGuildId()).toBe('g1');

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.updatingRankCharacterId()).toBeNull();
      expect(store.updatingRankGuildId()).toBeNull();
    });

    it('updates the character rank in myCharactersInGuild in memory', () => {
      service.getMyCharactersInGuild.mockReturnValue(of([makeCharInGuild(1), makeCharInGuild(2)]));
      store.loadMyCharactersInGuild('g1');

      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      expect(store.myCharacterList().find(c => c.characterId === 1)?.characterRank).toBe(CharacterRank.Alt);
      expect(store.myCharacterList().find(c => c.characterId === 2)?.characterRank).toBe(CharacterRank.Main);
    });

    it('updates the guild rank in memberships in memory', () => {
      service.getCharacterMemberships.mockReturnValue(of([makeMembership('g1'), makeMembership('g2')]));
      store.loadMemberships(1);

      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe();

      expect(store.membershipList().find(m => m.guildId === 'g1')?.characterRank).toBe(CharacterRank.Alt);
      expect(store.membershipList().find(m => m.guildId === 'g2')?.characterRank).toBe(CharacterRank.Main);
    });

    it('clears spinners and re-throws on error', () => {
      service.updateRank.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.updateRank(1, 'g1', CharacterRank.Alt).subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.updatingRankCharacterId()).toBeNull();
      expect(store.updatingRankGuildId()).toBeNull();
    });
  });

  // ── evictCharacter ────────────────────────────────────────────────────────

  describe('evictCharacter', () => {
    it('removes the character from myCharactersInGuild', () => {
      service.getMyCharactersInGuild.mockReturnValue(of([makeCharInGuild(1), makeCharInGuild(2)]));
      store.loadMyCharactersInGuild('g1');

      store.evictCharacter(1);

      expect(store.myCharacterList().map(c => c.characterId)).toEqual([2]);
    });

    it('resets memberships to undefined', () => {
      service.getCharacterMemberships.mockReturnValue(of([makeMembership('g1')]));
      store.loadMemberships(1);
      expect(store.memberships()).toBeDefined();

      store.evictCharacter(1);

      expect(store.memberships()).toBeUndefined();
    });

    it('is a no-op on myCharactersInGuild when the list is not yet loaded', () => {
      store.evictCharacter(1);
      expect(store.myCharactersInGuild()).toBeUndefined();
    });
  });

  // ── leaveGuild ────────────────────────────────────────────────────────────

  describe('leaveGuild', () => {
    it('sets spinners while the request is in flight', () => {
      const subject = new Subject<{ message: string }>();
      service.leaveGuild.mockReturnValue(subject.asObservable());
      store.leaveGuild(1, 'g1').subscribe();

      expect(store.leavingGuildId()).toBe('g1');
      expect(store.leavingCharacterId()).toBe(1);

      subject.next({ message: 'ok' });
      subject.complete();

      expect(store.leavingGuildId()).toBeNull();
      expect(store.leavingCharacterId()).toBeNull();
    });

    it('removes the guild from memberships in memory', () => {
      service.getCharacterMemberships.mockReturnValue(of([makeMembership('g1'), makeMembership('g2')]));
      store.loadMemberships(1);

      store.leaveGuild(1, 'g1').subscribe();

      expect(store.membershipList().map(m => m.guildId)).toEqual(['g2']);
    });

    it('removes the character from myCharactersInGuild in memory', () => {
      service.getMyCharactersInGuild.mockReturnValue(of([makeCharInGuild(1), makeCharInGuild(2)]));
      store.loadMyCharactersInGuild('g1');

      store.leaveGuild(1, 'g1').subscribe();

      expect(store.myCharacterList().map(c => c.characterId)).toEqual([2]);
    });

    it('clears spinners and re-throws on error', () => {
      service.leaveGuild.mockReturnValue(throwError(() => new Error('fail')));
      let errorCaught = false;
      store.leaveGuild(1, 'g1').subscribe({ error: () => { errorCaught = true; } });

      expect(errorCaught).toBe(true);
      expect(store.leavingGuildId()).toBeNull();
      expect(store.leavingCharacterId()).toBeNull();
    });
  });
});
