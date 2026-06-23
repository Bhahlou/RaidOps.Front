import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CharacterGuildsComponent } from './character-guilds.component';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
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

const httpError = (code: string) => new HttpErrorResponse({ error: { error: code, detail: 'irrelevant' }, status: 400 });

// Mirrors CharacterStore.membershipErrorKey for the codes these tests exercise — the exhaustive
// mapping itself is tested against the real implementation in character.store.spec.ts.
const membershipErrorKey = vi.fn((err: HttpErrorResponse) => {
  const code = (err.error as { error?: string } | null)?.error;
  const map: Record<string, string> = {
    AlreadyMember: 'characterDetail.guilds.errors.alreadyMember',
    NotAMember: 'characterDetail.guilds.errors.notAMember',
    RosterAccessDenied: 'characterDetail.guilds.errors.rosterAccessDenied',
  };
  return (code && map[code]) || 'characterDetail.guilds.errors.generic';
});

const setup = (character: Character = makeChar(1), autoExpand = false) => {
  const loadEligibleGuilds = vi.fn();
  const joinGuild  = vi.fn().mockReturnValue(of(undefined));
  const updateRank = vi.fn().mockReturnValue(of(undefined));
  const leaveGuild = vi.fn().mockReturnValue(of(undefined));
  const snackbar = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  const mockStore = {
    eligibleGuildList:    vi.fn().mockReturnValue([]),
    isEligibleLoading:    vi.fn().mockReturnValue(false),
    joiningGuildId:       signal<string | null>(null),
    leavingGuildId:       signal<string | null>(null),
    updatingRankGuildId:  signal<string | null>(null),
    loadEligibleGuilds,
    joinGuild,
    updateRank,
    leaveGuild,
    membershipErrorKey,
  };

  TestBed.configureTestingModule({
    imports: [CharacterGuildsComponent],
    providers: [
      { provide: CharacterStore, useValue: mockStore },
      { provide: SnackbarService, useValue: snackbar },
    ],
  }).overrideComponent(CharacterGuildsComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(CharacterGuildsComponent);
  fixture.componentRef.setInput('character', character);
  fixture.componentRef.setInput('autoExpand', autoExpand);
  fixture.detectChanges();

  return {
    component: fixture.componentInstance,
    fixture,
    loadEligibleGuilds,
    joinGuild,
    updateRank,
    leaveGuild,
    snackbar,
    eligibleGuildList: mockStore.eligibleGuildList,
    isEligibleLoading: mockStore.isEligibleLoading,
  };
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

  // ── eligibleGuilds / isEligibleLoading ───────────────────────────────────────

  it('eligibleGuilds reads the store keyed by this character\'s id', () => {
    const { component, eligibleGuildList } = setup(makeChar(9));

    component.eligibleGuilds();

    expect(eligibleGuildList).toHaveBeenCalledWith(9);
  });

  it('isEligibleLoading reads the store keyed by this character\'s id', () => {
    const { component, isEligibleLoading } = setup(makeChar(9));

    component.isEligibleLoading();

    expect(isEligibleLoading).toHaveBeenCalledWith(9);
  });

  // ── showEligible ──────────────────────────────────────────────────────────

  it('showEligible starts as false', () => {
    expect(setup().component.showEligible()).toBe(false);
  });

  // ── autoExpand ────────────────────────────────────────────────────────────

  describe('autoExpand', () => {
    it('does not expand or load eligible guilds by default', () => {
      const { component, loadEligibleGuilds } = setup(makeChar(7));

      expect(component.showEligible()).toBe(false);
      expect(loadEligibleGuilds).not.toHaveBeenCalled();
    });

    it('expands and loads eligible guilds on init when true', () => {
      const { component, loadEligibleGuilds } = setup(makeChar(7), true);

      expect(component.showEligible()).toBe(true);
      expect(loadEligibleGuilds).toHaveBeenCalledWith(7);
    });
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

    it('sets showEligible to false and shows a success snackbar', () => {
      const { component, snackbar } = setup();
      component.showEligible.set(true);

      component.joinGuild('g1');

      expect(component.showEligible()).toBe(false);
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.joinSuccess');
    });

    it('shows a mapped error snackbar when the backend rejects the join', () => {
      const { component, joinGuild, snackbar } = setup();
      joinGuild.mockReturnValue(throwError(() => httpError('AlreadyMember')));

      component.joinGuild('g1');

      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.alreadyMember');
    });

    it('falls back to the generic error key for an unmapped backend error code', () => {
      const { component, joinGuild, snackbar } = setup();
      joinGuild.mockReturnValue(throwError(() => httpError('SomethingUnexpected')));

      component.joinGuild('g1');

      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.generic');
    });
  });

  // ── updateRank ────────────────────────────────────────────────────────────

  describe('updateRank', () => {
    it('calls store.updateRank with characterId, guildId and rank, and shows a success snackbar', () => {
      const { component, updateRank, snackbar } = setup(makeChar(3));

      component.updateRank('g1', CharacterRank.Alt);

      expect(updateRank).toHaveBeenCalledWith(3, 'g1', CharacterRank.Alt);
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.rankUpdateSuccess');
    });

    it('shows a mapped error snackbar when the backend rejects the update', () => {
      const { component, updateRank, snackbar } = setup(makeChar(3));
      updateRank.mockReturnValue(throwError(() => httpError('NotAMember')));

      component.updateRank('g1', CharacterRank.Alt);

      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.notAMember');
    });
  });

  // ── leaveGuild ────────────────────────────────────────────────────────────

  describe('leaveGuild', () => {
    it('calls store.leaveGuild with characterId and guildId, and shows a success snackbar', () => {
      const { component, leaveGuild, snackbar } = setup(makeChar(3));

      component.leaveGuild('g1');

      expect(leaveGuild).toHaveBeenCalledWith(3, 'g1');
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.leaveSuccess');
    });

    it('shows a mapped error snackbar when the backend rejects the leave', () => {
      const { component, leaveGuild, snackbar } = setup(makeChar(3));
      leaveGuild.mockReturnValue(throwError(() => httpError('RosterAccessDenied')));

      component.leaveGuild('g1');

      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.rosterAccessDenied');
    });
  });
});
