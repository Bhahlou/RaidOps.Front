import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CharacterGuildsComponent } from './character-guilds.component';
import { CharacterStore } from '../../stores/character.store';
import { Character } from '../../models/character.model';
import { GuildMembership } from '../../../guilds/models/guild-membership.model';
import { CharacterRank } from '../../../guilds/models/character-rank.enum';

const makeMembership = (guildId: string): GuildMembership => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
  characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id, name: `Char${id}`, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [],
  guildMemberships: [],
  ...overrides,
});

const setup = (character: Character = makeChar(1)) => {
  const loadEligibleGuilds = vi.fn();
  const joinGuild  = vi.fn().mockReturnValue(of(undefined));
  const updateRank = vi.fn().mockReturnValue(of(undefined));
  const leaveGuild = vi.fn().mockReturnValue(of(undefined));

  const mockStore = {
    eligibleGuildList:    signal([]),
    isEligibleLoading:    signal(false),
    joiningGuildId:       signal<string | null>(null),
    leavingGuildId:       signal<string | null>(null),
    updatingRankGuildId:  signal<string | null>(null),
    loadEligibleGuilds,
    joinGuild,
    updateRank,
    leaveGuild,
  };

  TestBed.configureTestingModule({
    imports: [CharacterGuildsComponent],
    providers: [{ provide: CharacterStore, useValue: mockStore }],
  }).overrideComponent(CharacterGuildsComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(CharacterGuildsComponent);
  fixture.componentRef.setInput('character', character);
  fixture.detectChanges();

  return { component: fixture.componentInstance, fixture, loadEligibleGuilds, joinGuild, updateRank, leaveGuild };
};

describe('CharacterGuildsComponent', () => {
  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── memberships ───────────────────────────────────────────────────────────

  it('memberships reads guildMemberships directly off the character input', () => {
    const char = makeChar(1, { guildMemberships: [makeMembership('g1')] });
    const { component } = setup(char);

    expect(component.memberships()).toEqual([makeMembership('g1')]);
  });

  // ── showEligible ──────────────────────────────────────────────────────────

  it('showEligible starts as false', () => {
    expect(setup().component.showEligible()).toBe(false);
  });

  // ── toggleEligible ────────────────────────────────────────────────────────

  describe('toggleEligible', () => {
    it('sets showEligible to true and loads eligible guilds when called while false', () => {
      const { component, loadEligibleGuilds } = setup(makeChar(7));

      component.toggleEligible();

      expect(component.showEligible()).toBe(true);
      expect(loadEligibleGuilds).toHaveBeenCalledWith(7);
    });

    it('sets showEligible to false without calling loadEligibleGuilds when called while true', () => {
      const { component, loadEligibleGuilds } = setup(makeChar(7));
      component.showEligible.set(true);

      component.toggleEligible();

      expect(component.showEligible()).toBe(false);
      expect(loadEligibleGuilds).not.toHaveBeenCalled();
    });
  });

  // ── getRankSelection / setRankSelection ───────────────────────────────────

  describe('getRankSelection', () => {
    it('returns Main by default', () => {
      expect(setup().component.getRankSelection('g1')).toBe(CharacterRank.Main);
    });

    it('returns the rank set via setRankSelection', () => {
      const { component } = setup();

      component.setRankSelection('g1', CharacterRank.Alt);

      expect(component.getRankSelection('g1')).toBe(CharacterRank.Alt);
    });

    it('manages ranks independently per guild', () => {
      const { component } = setup();

      component.setRankSelection('g1', CharacterRank.Split);
      component.setRankSelection('g2', CharacterRank.Alt);

      expect(component.getRankSelection('g1')).toBe(CharacterRank.Split);
      expect(component.getRankSelection('g2')).toBe(CharacterRank.Alt);
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

  // ── joinGuild ─────────────────────────────────────────────────────────────

  describe('joinGuild', () => {
    it('calls store.joinGuild with characterId, guildId and selected rank', () => {
      const { component, joinGuild } = setup(makeChar(5));
      component.setRankSelection('g1', CharacterRank.Split);

      component.joinGuild('g1');

      expect(joinGuild).toHaveBeenCalledWith(5, 'g1', CharacterRank.Split);
    });

    it('sets showEligible to false on success', () => {
      const { component } = setup();
      component.showEligible.set(true);

      component.joinGuild('g1');

      expect(component.showEligible()).toBe(false);
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  it('updateRank calls store.updateRank with characterId, guildId and rank', () => {
    const { component, updateRank } = setup(makeChar(3));

    component.updateRank('g1', CharacterRank.Alt);

    expect(updateRank).toHaveBeenCalledWith(3, 'g1', CharacterRank.Alt);
  });

  // ── leaveGuild ────────────────────────────────────────────────────────────

  it('leaveGuild calls store.leaveGuild with characterId and guildId', () => {
    const { component, leaveGuild } = setup(makeChar(3));

    component.leaveGuild('g1');

    expect(leaveGuild).toHaveBeenCalledWith(3, 'g1');
  });
});
