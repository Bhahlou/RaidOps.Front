import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CharacterGuildsComponent } from './character-guilds.component';
import { GuildMembershipStore } from '../../../guilds/stores/guild-membership.store';
import { CharacterRank } from '../../../guilds/models/character-rank.enum';

const setup = (characterId = 1) => {
  const loadMemberships   = vi.fn();
  const loadEligibleGuilds = vi.fn();
  const joinGuild  = vi.fn().mockReturnValue(of(undefined));
  const updateRank = vi.fn().mockReturnValue(of(undefined));
  const leaveGuild = vi.fn().mockReturnValue(of(undefined));

  const mockStore = {
    membershipList:       signal([]),
    isMembershipsLoading: signal(false),
    eligibleGuildList:    signal([]),
    isEligibleLoading:    signal(false),
    joiningGuildId:       signal<string | null>(null),
    leavingGuildId:       signal<string | null>(null),
    updatingRankGuildId:  signal<string | null>(null),
    loadMemberships,
    loadEligibleGuilds,
    joinGuild,
    updateRank,
    leaveGuild,
  };

  TestBed.configureTestingModule({
    imports: [CharacterGuildsComponent],
    providers: [{ provide: GuildMembershipStore, useValue: mockStore }],
  }).overrideComponent(CharacterGuildsComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(CharacterGuildsComponent);
  fixture.componentRef.setInput('characterId', characterId);
  fixture.detectChanges();

  return { component: fixture.componentInstance, fixture, loadMemberships, loadEligibleGuilds, joinGuild, updateRank, leaveGuild };
};

describe('CharacterGuildsComponent', () => {
  it('should create', () => {
    expect(setup().component).toBeTruthy();
  });

  // ── effect — loadMemberships ───────────────────────────────────────────────

  it('calls loadMemberships on construction with the characterId input', () => {
    const { loadMemberships } = setup(42);
    expect(loadMemberships).toHaveBeenCalledWith(42);
  });

  // ── showEligible ──────────────────────────────────────────────────────────

  it('showEligible starts as false', () => {
    expect(setup().component.showEligible()).toBe(false);
  });

  // ── toggleEligible ────────────────────────────────────────────────────────

  describe('toggleEligible', () => {
    it('sets showEligible to true and loads eligible guilds when called while false', () => {
      const { component, loadEligibleGuilds } = setup(7);

      component.toggleEligible();

      expect(component.showEligible()).toBe(true);
      expect(loadEligibleGuilds).toHaveBeenCalledWith(7);
    });

    it('sets showEligible to false without calling loadEligibleGuilds when called while true', () => {
      const { component, loadEligibleGuilds } = setup(7);
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
      const { component, joinGuild } = setup(5);
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
    const { component, updateRank } = setup(3);

    component.updateRank('g1', CharacterRank.Alt);

    expect(updateRank).toHaveBeenCalledWith(3, 'g1', CharacterRank.Alt);
  });

  // ── leaveGuild ────────────────────────────────────────────────────────────

  it('leaveGuild calls store.leaveGuild with characterId and guildId', () => {
    const { component, leaveGuild } = setup(3);

    component.leaveGuild('g1');

    expect(leaveGuild).toHaveBeenCalledWith(3, 'g1');
  });
});
