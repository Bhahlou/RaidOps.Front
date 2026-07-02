import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { GuildMyCharactersComponent } from './guild-my-characters.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';
import { GuildMembership } from '../../models/guild-membership.model';
import { GuildRosterStore } from '../../stores/guild-roster.store';

const makeMembership = (guildId: string, rank = CharacterRank.Main): GuildMembership => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
  characterRank: rank, joinedAt: '2025-01-01',
});

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id, name: `Char${id}`, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [], guildMemberships: [],
  ...overrides,
});

const setup = (opts: {
  guildId?: string;
  characterList?: Character[];
} = {}) => {
  const { guildId = 'g1', characterList = [] } = opts;

  const joinGuild  = vi.fn().mockReturnValue(of(undefined));
  const updateRank = vi.fn().mockReturnValue(of(undefined));
  const leaveGuild = vi.fn().mockReturnValue(of(undefined));
  const membershipErrorKey = vi.fn().mockReturnValue('characterDetail.guilds.errors.generic');
  const snackbar = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  const loadRoster = vi.fn().mockReturnValue(of([]));

  const mockStore = {
    characterList:            signal(characterList),
    isCharactersLoading:      signal(false),
    joiningCharacterId:       signal<number | null>(null),
    leavingCharacterId:       signal<number | null>(null),
    updatingRankCharacterId:  signal<number | null>(null),
    joinGuild,
    updateRank,
    leaveGuild,
    membershipErrorKey,
  };
  const mockRosterStore = { isLoading: signal(false), members: signal([]), loadRoster };

  TestBed.configureTestingModule({
    imports: [GuildMyCharactersComponent],
    providers: [
      { provide: CharacterStore, useValue: mockStore },
      { provide: SnackbarService, useValue: snackbar },
      { provide: GuildRosterStore, useValue: mockRosterStore },
    ],
  }).overrideComponent(GuildMyCharactersComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(GuildMyCharactersComponent);
  fixture.componentRef.setInput('guildId', guildId);
  fixture.detectChanges();

  return { component: fixture.componentInstance, joinGuild, updateRank, leaveGuild, membershipErrorKey, snackbar, loadRoster };
};

describe('GuildMyCharactersComponent', () => {
  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── showAddPanel ──────────────────────────────────────────────────────────

  it('showAddPanel starts as false', () => {
    expect(setup().component.showAddPanel()).toBe(false);
  });

  // ── toggleAddPanel ────────────────────────────────────────────────────────

  describe('toggleAddPanel', () => {
    it('sets showAddPanel to true when false', () => {
      const { component } = setup();
      component.toggleAddPanel();
      expect(component.showAddPanel()).toBe(true);
    });

    it('sets showAddPanel back to false when true', () => {
      const { component } = setup();
      component.toggleAddPanel();
      component.toggleAddPanel();
      expect(component.showAddPanel()).toBe(false);
    });
  });

  // ── myCharacters / addableCharacters ─────────────────────────────────────

  describe('myCharacters', () => {
    it('returns characters with a membership in this guild', () => {
      const { component } = setup({
        guildId: 'g1',
        characterList: [
          makeChar(1, { guildMemberships: [makeMembership('g1')] }),
          makeChar(2, { guildMemberships: [] }),
        ],
      });
      expect(component.myCharacters().map(c => c.id)).toEqual([1]);
    });

    it('sorts by roster rank — Main, then Split, then Alt', () => {
      const { component } = setup({
        guildId: 'g1',
        characterList: [
          makeChar(1, { guildMemberships: [makeMembership('g1', CharacterRank.Alt)] }),
          makeChar(2, { guildMemberships: [makeMembership('g1', CharacterRank.Main)] }),
          makeChar(3, { guildMemberships: [makeMembership('g1', CharacterRank.Split)] }),
        ],
      });

      expect(component.myCharacters().map(c => c.id)).toEqual([2, 3, 1]);
    });

    it('keeps the original relative order between characters sharing the same rank', () => {
      const { component } = setup({
        guildId: 'g1',
        characterList: [
          makeChar(1, { guildMemberships: [makeMembership('g1', CharacterRank.Main)] }),
          makeChar(2, { guildMemberships: [makeMembership('g1', CharacterRank.Main)] }),
        ],
      });

      expect(component.myCharacters().map(c => c.id)).toEqual([1, 2]);
    });
  });

  describe('addableCharacters', () => {
    it('returns characters not already in the guild', () => {
      const { component } = setup({
        guildId: 'g1',
        characterList: [
          makeChar(1, { guildMemberships: [makeMembership('g1')] }),
          makeChar(2, { guildMemberships: [] }),
        ],
      });
      expect(component.addableCharacters().map(c => c.id)).toEqual([2]);
    });

    it('returns all characters when none are in the guild', () => {
      const { component } = setup({
        characterList: [makeChar(1), makeChar(2)],
      });
      expect(component.addableCharacters().length).toBe(2);
    });

    it('returns empty when all characters are already in the guild', () => {
      const { component } = setup({
        guildId: 'g1',
        characterList: [
          makeChar(1, { guildMemberships: [makeMembership('g1')] }),
          makeChar(2, { guildMemberships: [makeMembership('g1')] }),
        ],
      });
      expect(component.addableCharacters()).toEqual([]);
    });
  });

  // ── rankFor ───────────────────────────────────────────────────────────────

  describe('rankFor', () => {
    it('returns the membership rank for this guild', () => {
      const char = makeChar(1, { guildMemberships: [makeMembership('g1', CharacterRank.Alt)] });
      const { component } = setup({ guildId: 'g1', characterList: [char] });

      expect(component.rankFor(char)).toBe(CharacterRank.Alt);
    });

    it('defaults to Main when no membership matches', () => {
      const char = makeChar(1, { guildMemberships: [] });
      const { component } = setup({ guildId: 'g1', characterList: [char] });

      expect(component.rankFor(char)).toBe(CharacterRank.Main);
    });
  });

  // ── characterLink ─────────────────────────────────────────────────────────

  describe('characterLink', () => {
    it('builds the route segments from the character model', () => {
      const char = makeChar(1, { name: 'Bhahlounette', branchName: 'Classic Anniversary', realmSlug: 'thunderstrike' });
      const { component } = setup({ characterList: [char] });

      expect(component.characterLink(char)).toEqual(['/characters', 'classic-anniversary', 'thunderstrike', 'bhahlounette']);
    });

    it('converts underscores in branchName to dashes', () => {
      const char = makeChar(1, { name: 'Hero', branchName: 'Classic_Anniversary', realmSlug: 'realm' });
      const { component } = setup({ characterList: [char] });

      expect(component.characterLink(char)[1]).toBe('classic-anniversary');
    });
  });

  // ── getRankSelection / setRankSelection ───────────────────────────────────

  describe('getRankSelection', () => {
    it('returns Main by default', () => {
      expect(setup().component.getRankSelection(1)).toBe(CharacterRank.Main);
    });

    it('returns the rank set via setRankSelection', () => {
      const { component } = setup();
      component.setRankSelection(1, CharacterRank.Alt);
      expect(component.getRankSelection(1)).toBe(CharacterRank.Alt);
    });

    it('manages ranks independently per character', () => {
      const { component } = setup();
      component.setRankSelection(1, CharacterRank.Split);
      component.setRankSelection(2, CharacterRank.Alt);
      expect(component.getRankSelection(1)).toBe(CharacterRank.Split);
      expect(component.getRankSelection(2)).toBe(CharacterRank.Alt);
    });
  });

  // ── rankLabel ─────────────────────────────────────────────────────────────

  describe('rankLabel', () => {
    it('returns "Main" for CharacterRank.Main', () => {
      expect(setup().component.rankLabel(CharacterRank.Main)).toBe('Main');
    });

    it('returns "Split" for CharacterRank.Split', () => {
      expect(setup().component.rankLabel(CharacterRank.Split)).toBe('Split');
    });

    it('returns "Alt" for CharacterRank.Alt', () => {
      expect(setup().component.rankLabel(CharacterRank.Alt)).toBe('Alt');
    });
  });

  // ── joinCharacter ─────────────────────────────────────────────────────────

  describe('joinCharacter', () => {
    it('calls store.joinGuild with characterId, guildId and selected rank', () => {
      const { component, joinGuild } = setup({ guildId: 'g1' });
      const char = makeChar(5);
      component.setRankSelection(5, CharacterRank.Split);

      component.joinCharacter(char);

      expect(joinGuild).toHaveBeenCalledWith(5, 'g1', CharacterRank.Split);
    });

    it('sets showAddPanel to false, shows a success snackbar, and refreshes the roster', () => {
      const { component, snackbar, loadRoster } = setup({ guildId: 'g1' });
      component.showAddPanel.set(true);

      component.joinCharacter(makeChar(1));

      expect(component.showAddPanel()).toBe(false);
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.joinSuccess');
      expect(loadRoster).toHaveBeenCalledWith('g1', true);
    });

    it('shows an error snackbar mapped via store.membershipErrorKey when the join fails', () => {
      const { component, joinGuild, membershipErrorKey, snackbar } = setup();
      const err = new HttpErrorResponse({ error: { error: 'AlreadyMember' }, status: 400 });
      joinGuild.mockReturnValue(throwError(() => err));
      membershipErrorKey.mockReturnValue('characterDetail.guilds.errors.alreadyMember');

      component.joinCharacter(makeChar(1));

      expect(membershipErrorKey).toHaveBeenCalledWith(err);
      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.alreadyMember');
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  describe('updateRank', () => {
    it('calls store.updateRank with characterId, guildId and rank, shows a success snackbar, and refreshes the roster', () => {
      const { component, updateRank, snackbar, loadRoster } = setup({ guildId: 'g1' });

      component.updateRank(3, CharacterRank.Alt);

      expect(updateRank).toHaveBeenCalledWith(3, 'g1', CharacterRank.Alt);
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.rankUpdateSuccess');
      expect(loadRoster).toHaveBeenCalledWith('g1', true);
    });

    it('shows an error snackbar when the update fails', () => {
      const { component, updateRank, snackbar } = setup({ guildId: 'g1' });
      updateRank.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'NotAMember' }, status: 400 })));

      component.updateRank(3, CharacterRank.Alt);

      expect(snackbar.error).toHaveBeenCalled();
    });
  });

  // ── removeCharacter ───────────────────────────────────────────────────────

  describe('removeCharacter', () => {
    it('calls store.leaveGuild with characterId and guildId, shows a success snackbar, and refreshes the roster', () => {
      const { component, leaveGuild, snackbar, loadRoster } = setup({ guildId: 'g1' });

      component.removeCharacter(7);

      expect(leaveGuild).toHaveBeenCalledWith(7, 'g1');
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.leaveSuccess');
      expect(loadRoster).toHaveBeenCalledWith('g1', true);
    });

    it('shows an error snackbar when the leave fails', () => {
      const { component, leaveGuild, snackbar } = setup({ guildId: 'g1' });
      leaveGuild.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'NotAMember' }, status: 400 })));

      component.removeCharacter(7);

      expect(snackbar.error).toHaveBeenCalled();
    });
  });
});
