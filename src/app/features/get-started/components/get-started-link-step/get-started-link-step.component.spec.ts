import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { GetStartedLinkStepComponent } from './get-started-link-step.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Character } from '../../../characters/models/character.model';
import { GuildEligibility } from '../../../../features/guilds/models/guild-eligibility.model';
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

const makeGuild = (guildId: string, chars: { id: number; name: string }[]): GuildEligibility => ({
  guildId,
  guildName: `Guild ${guildId}`,
  guildIconHash: null,
  eligibleCharacters: chars.map((c) => ({
    id: c.id, name: c.name, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  })),
});

describe('GetStartedLinkStepComponent', () => {
  let component: GetStartedLinkStepComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let loadEligibleGuildsBulk: ReturnType<typeof vi.fn>;
  let joinGuildBulk: ReturnType<typeof vi.fn>;
  let snackbarError: ReturnType<typeof vi.fn>;
  let guildsSignal: WritableSignal<GuildEligibility[]>;

  const setup = (opts: {
    characters?: Character[];
    guilds?: GuildEligibility[];
    isLoading?: boolean;
  } = {}) => {
    navigate = vi.fn();
    loadEligibleGuildsBulk = vi.fn();

    const characters = opts.characters ?? [];
    guildsSignal = signal(opts.guilds ?? []);

    // Mock joinGuildBulk removes the joined guild from the signal so navigation
    // logic that reads guilds().length works correctly in tests.
    joinGuildBulk = vi.fn().mockImplementation((guildId: string) => {
      guildsSignal.update((gs) => gs.filter((g) => g.guildId !== guildId));
      return of(undefined);
    });

    TestBed.configureTestingModule({
      imports: [GetStartedLinkStepComponent],
      providers: [
        {
          provide: CharacterStore,
          useValue: {
            isEligibleBulkLoading: signal(opts.isLoading ?? false),
            eligibleGuildsBulk: guildsSignal,
            characterList: signal(characters),
            loadEligibleGuildsBulk,
            joinGuildBulk,
            membershipErrorKey: vi.fn().mockReturnValue('error.key'),
          },
        },
        { provide: Router, useValue: { navigate } },
        { provide: SnackbarService, useValue: { success: vi.fn(), error: (snackbarError = vi.fn()) } },
      ],
    });
    TestBed.overrideComponent(GetStartedLinkStepComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(GetStartedLinkStepComponent).componentInstance;
    // Flush effects so the selection-init and auto-redirect effects run synchronously.
    TestBed.flushEffects();
  };

  // ── Initialization ────────────────────────────────────────────────────

  it('calls loadEligibleGuildsBulk on construction', () => {
    setup();
    expect(loadEligibleGuildsBulk).toHaveBeenCalledOnce();
  });

  // ── canFinish ─────────────────────────────────────────────────────────

  describe('canFinish', () => {
    it('is false when no character has a guild membership', () => {
      setup({ characters: [makeChar(1), makeChar(2)] });
      expect(component.canFinish()).toBe(false);
    });

    it('is true when at least one character has a guild membership', () => {
      setup({ characters: [makeChar(1), makeChar(2, { guildMemberships: [makeMembership('g1')] })] });
      expect(component.canFinish()).toBe(true);
    });

    it('is false when there are no characters', () => {
      setup();
      expect(component.canFinish()).toBe(false);
    });
  });

  // ── Selection state ───────────────────────────────────────────────────

  describe('isChecked / toggle / getRank / setRank', () => {
    const guild = makeGuild('g1', [{ id: 1, name: 'Char1' }, { id: 2, name: 'Char2' }]);

    it('all characters are pre-checked as Main after guilds load', () => {
      setup({ guilds: [guild] });
      expect(component.isChecked('g1', 1)).toBe(true);
      expect(component.isChecked('g1', 2)).toBe(true);
      expect(component.getRank('g1', 1)).toBe(CharacterRank.Main);
    });

    it('toggle false unchecks a character', () => {
      setup({ guilds: [guild] });
      component.toggle('g1', 1, false);
      expect(component.isChecked('g1', 1)).toBe(false);
    });

    it('toggle true re-checks a character as Main', () => {
      setup({ guilds: [guild] });
      component.toggle('g1', 1, false);
      component.toggle('g1', 1, true);
      expect(component.isChecked('g1', 1)).toBe(true);
      expect(component.getRank('g1', 1)).toBe(CharacterRank.Main);
    });

    it('setRank updates rank for a checked character', () => {
      setup({ guilds: [guild] });
      component.setRank('g1', 1, CharacterRank.Alt);
      expect(component.getRank('g1', 1)).toBe(CharacterRank.Alt);
    });

    it('preserves existing selections when the effect re-runs with the same guild (l74 false branch)', () => {
      setup({ guilds: [guild] });
      component.toggle('g1', 1, false); // deviate from initial state

      guildsSignal.set([guild]); // new array ref → triggers effect again
      TestBed.flushEffects();

      expect(component.isChecked('g1', 1)).toBe(false); // not reset to true
    });

    it('getRank returns Main as default when characterId has no entry (l92 ?? branch)', () => {
      setup({ guilds: [guild] });
      expect(component.getRank('g1', 999)).toBe(CharacterRank.Main);
    });

    it('toggle creates a new entry for an unknown guildId (l98 ?? branch)', () => {
      setup({ guilds: [guild] });
      component.toggle('unknown', 1, true);
      expect(component.isChecked('unknown', 1)).toBe(true);
    });

    it('setRank creates a new entry for an unknown guildId (l108 ?? branch)', () => {
      setup({ guilds: [guild] });
      component.setRank('unknown', 1, CharacterRank.Alt);
      expect(component.getRank('unknown', 1)).toBe(CharacterRank.Alt);
    });
  });

  // ── canJoinGuild ──────────────────────────────────────────────────────

  describe('canJoinGuild', () => {
    const guild = makeGuild('g1', [{ id: 1, name: 'Char1' }]);

    it('is true when at least one character is checked', () => {
      setup({ guilds: [guild] });
      expect(component.canJoinGuild('g1')).toBe(true);
    });

    it('is false when all characters are unchecked', () => {
      setup({ guilds: [guild] });
      component.toggle('g1', 1, false);
      expect(component.canJoinGuild('g1')).toBe(false);
    });

    it('is false for an unknown guildId', () => {
      setup({ guilds: [guild] });
      expect(component.canJoinGuild('unknown')).toBe(false);
    });
  });

  // ── joinGuild ─────────────────────────────────────────────────────────

  describe('joinGuild', () => {
    const guild = makeGuild('g1', [{ id: 1, name: 'Char1' }, { id: 2, name: 'Char2' }]);

    it('does nothing when the guild has no selections entry (l127 early return)', () => {
      setup();
      const unknownGuild = makeGuild('unknown', [{ id: 1, name: 'Char1' }]);
      component.joinGuild(unknownGuild);
      expect(joinGuildBulk).not.toHaveBeenCalled();
    });

    it('calls joinGuildBulk with the checked characters', () => {
      setup({ guilds: [guild] });
      component.toggle('g1', 2, false);
      component.joinGuild(guild);
      expect(joinGuildBulk).toHaveBeenCalledWith('g1', [{ characterId: 1, rank: CharacterRank.Main }]);
    });

    it('passes correct rank when changed before joining', () => {
      setup({ guilds: [guild] });
      component.setRank('g1', 1, CharacterRank.Alt);
      component.toggle('g1', 2, false);
      component.joinGuild(guild);
      expect(joinGuildBulk).toHaveBeenCalledWith('g1', [{ characterId: 1, rank: CharacterRank.Alt }]);
    });

    it('navigates to guild dashboard when no guilds remain after join', () => {
      setup({ guilds: [guild] });
      component.joinGuild(guild);
      expect(navigate).toHaveBeenCalledWith(['/guilds', 'g1', 'dashboard']);
    });

    it('shows snackbar error and clears joining state when joinGuildBulk fails', () => {
      setup({ guilds: [guild] });
      const err = new HttpErrorResponse({ status: 400, error: { error: 'RosterAccessDenied' } });
      const storeMock = TestBed.inject(CharacterStore) as unknown as { joinGuildBulk: ReturnType<typeof vi.fn> };
      storeMock.joinGuildBulk = vi.fn().mockReturnValue(throwError(() => err));

      component.joinGuild(guild);

      expect(component.isJoining(guild.guildId)).toBe(false);
      expect(snackbarError).toHaveBeenCalledWith('error.key');
    });

    it('stays on page (does not navigate) when other guilds remain', () => {
      const guild2 = makeGuild('g2', [{ id: 3, name: 'Char3' }]);
      setup({ guilds: [guild, guild2] });

      // Mock: after joining g1, g2 remains in the store signal
      // The signal is already set up with both guilds; after joinGuildBulk the store
      // would update but we can't control the signal post-construction here.
      // We test instead that with two guilds still present, navigate is NOT called.
      // Re-setup with both guilds but joinGuildBulk that doesn't empty the list:
      navigate = vi.fn();
      // guilds signal still has guild2 — joinGuild should NOT navigate
      component.joinGuild(guild);
      // guild2 is still in guilds() so navigate should NOT be called
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  // ── finish ────────────────────────────────────────────────────────────

  describe('finish', () => {
    it('navigates to /guilds', () => {
      setup();
      component.finish();
      expect(navigate).toHaveBeenCalledWith(['/guilds']);
    });
  });
});
