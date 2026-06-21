import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { GuildMyCharactersComponent } from './guild-my-characters.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';
import { GuildMembership } from '../../models/guild-membership.model';

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

  const mockStore = {
    characterList:            signal(characterList),
    isCharactersLoading:      signal(false),
    joiningCharacterId:       signal<number | null>(null),
    leavingCharacterId:       signal<number | null>(null),
    updatingRankCharacterId:  signal<number | null>(null),
    joinGuild,
    updateRank,
    leaveGuild,
  };

  TestBed.configureTestingModule({
    imports: [GuildMyCharactersComponent],
    providers: [
      { provide: CharacterStore, useValue: mockStore },
    ],
  }).overrideComponent(GuildMyCharactersComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(GuildMyCharactersComponent);
  fixture.componentRef.setInput('guildId', guildId);
  fixture.detectChanges();

  return { component: fixture.componentInstance, joinGuild, updateRank, leaveGuild };
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

    it('sets showAddPanel to false on success', () => {
      const { component } = setup();
      component.showAddPanel.set(true);

      component.joinCharacter(makeChar(1));

      expect(component.showAddPanel()).toBe(false);
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  it('updateRank calls store.updateRank with characterId, guildId and rank', () => {
    const { component, updateRank } = setup({ guildId: 'g1' });

    component.updateRank(3, CharacterRank.Alt);

    expect(updateRank).toHaveBeenCalledWith(3, 'g1', CharacterRank.Alt);
  });

  // ── removeCharacter ───────────────────────────────────────────────────────

  it('removeCharacter calls store.leaveGuild with characterId and guildId', () => {
    const { component, leaveGuild } = setup({ guildId: 'g1' });

    component.removeCharacter(7);

    expect(leaveGuild).toHaveBeenCalledWith(7, 'g1');
  });
});
