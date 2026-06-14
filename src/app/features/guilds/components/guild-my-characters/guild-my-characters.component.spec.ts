import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { GuildMyCharactersComponent } from './guild-my-characters.component';
import { GuildMembershipStore } from '../../stores/guild-membership.store';
import { CharacterStore } from '../../../characters/stores/character.store';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';
import { CharacterInGuild } from '../../models/character-in-guild.model';

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id, name: `Char${id}`, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, specs: [],
  ...overrides,
});

const makeCharInGuild = (characterId: number): CharacterInGuild => ({
  characterId, name: `Char${characterId}`, realmName: 'Thunderstrike',
  className: 'Druid', classColor: '#FF7C0A', avatarUrl: null,
  guildName: 'Epic Guild', characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

const setup = (opts: {
  guildId?: string;
  myCharacters?: CharacterInGuild[];
  characterList?: Character[];
} = {}) => {
  const { guildId = 'g1', myCharacters = [], characterList = [] } = opts;

  const loadMyCharactersInGuild = vi.fn();
  const joinGuild  = vi.fn().mockReturnValue(of(undefined));
  const updateRank = vi.fn().mockReturnValue(of(undefined));
  const leaveGuild = vi.fn().mockReturnValue(of(undefined));

  const mockStore = {
    myCharacterList:          signal(myCharacters),
    isMyCharactersLoading:    signal(false),
    joiningCharacterId:       signal<number | null>(null),
    leavingCharacterId:       signal<number | null>(null),
    updatingRankCharacterId:  signal<number | null>(null),
    loadMyCharactersInGuild,
    joinGuild,
    updateRank,
    leaveGuild,
  };

  TestBed.configureTestingModule({
    imports: [GuildMyCharactersComponent],
    providers: [
      { provide: GuildMembershipStore, useValue: mockStore },
      { provide: CharacterStore, useValue: { characterList: signal(characterList) } },
    ],
  }).overrideComponent(GuildMyCharactersComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(GuildMyCharactersComponent);
  fixture.componentRef.setInput('guildId', guildId);
  fixture.detectChanges();

  return { component: fixture.componentInstance, loadMyCharactersInGuild, joinGuild, updateRank, leaveGuild };
};

describe('GuildMyCharactersComponent', () => {
  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── effect — loadMyCharactersInGuild ──────────────────────────────────────

  it('calls loadMyCharactersInGuild on construction with the guildId input', () => {
    const { loadMyCharactersInGuild } = setup({ guildId: 'guild-42' });
    expect(loadMyCharactersInGuild).toHaveBeenCalledWith('guild-42');
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

  // ── addableCharacters ─────────────────────────────────────────────────────

  describe('addableCharacters', () => {
    it('returns characters not already in the guild', () => {
      const { component } = setup({
        myCharacters:  [makeCharInGuild(1)],
        characterList: [makeChar(1), makeChar(2)],
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
        myCharacters:  [makeCharInGuild(1), makeCharInGuild(2)],
        characterList: [makeChar(1), makeChar(2)],
      });
      expect(component.addableCharacters()).toEqual([]);
    });
  });

  // ── characterLink ─────────────────────────────────────────────────────────

  describe('characterLink', () => {
    it('builds the route segments from the character model', () => {
      const char = makeChar(1, { name: 'Bhahlounette', branchName: 'Classic Anniversary', realmSlug: 'thunderstrike' });
      const { component } = setup({ characterList: [char] });

      expect(component.characterLink(1)).toEqual(['/characters', 'classic-anniversary', 'thunderstrike', 'bhahlounette']);
    });

    it('converts underscores in branchName to dashes', () => {
      const char = makeChar(1, { name: 'Hero', branchName: 'Classic_Anniversary', realmSlug: 'realm' });
      const { component } = setup({ characterList: [char] });

      expect(component.characterLink(1)?.[1]).toBe('classic-anniversary');
    });

    it('returns null when the character is not found', () => {
      const { component } = setup();
      expect(component.characterLink(999)).toBeNull();
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
