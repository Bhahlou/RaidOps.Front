import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { RaidRosterPoolComponent } from './raid-roster-pool.component';
import { GuildRosterStore } from '../../../roster/stores/guild-roster.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { CharacterRank } from '../../../models/character-rank.enum';
import { GuildRosterMember } from '../../../models/guild-roster-member.model';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';

const member = (overrides?: Partial<GuildRosterMember>): GuildRosterMember => ({
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  className: 'Warrior',
  classColor: '#c79c6e',
  level: 60,
  branchName: 'Classic Anniversary',
  realmSlug: 'gehennas',
  avatarUrl: null,
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  playerAvatarHash: null,
  playerGuildAvatarUrl: null,
  raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
  canExclude: true,
  ...overrides,
});

const raidEvent = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 1,
  raidSeriesId: null,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [{ id: 10, name: 'Serpentshrine Cavern', shortCode: 'SSC' }],
  assignments: [],
  ineligiblePlayerDiscordIds: [],
  mySignupStatus: null,
  acceptedCharacterIdsByPlayerDiscordId: {},
  dedicatedAnnouncementChannelId: null,
  dedicatedAnnouncementChannelIsBotOwned: false,
  ...overrides,
});

describe('RaidRosterPoolComponent', () => {
  let fixture: ComponentFixture<RaidRosterPoolComponent>;
  let component: RaidRosterPoolComponent;
  let rosterStore: { members: ReturnType<typeof signal>; isLoading: ReturnType<typeof signal>; loadRoster: ReturnType<typeof vi.fn> };
  let boardStore: { startDrag: ReturnType<typeof vi.fn>; endDrag: ReturnType<typeof vi.fn> };

  const setup = (members: GuildRosterMember[] = [], events: RaidEvent[] = [raidEvent()], opts?: { disabled?: boolean; currentUserDiscordId?: string | null }) => {
    rosterStore = { members: signal(members), isLoading: signal(false), loadRoster: vi.fn() };
    boardStore = { startDrag: vi.fn(), endDrag: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RaidRosterPoolComponent],
      providers: [
        { provide: GuildRosterStore, useValue: rosterStore },
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: TranslocoService, useValue: { activeLang: signal('fr'), translate: vi.fn((key: string) => key) } },
      ],
    }).overrideComponent(RaidRosterPoolComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidRosterPoolComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('guildBranchId', 7);
    fixture.componentRef.setInput('events', events);
    if (opts?.disabled !== undefined) fixture.componentRef.setInput('disabled', opts.disabled);
    if (opts?.currentUserDiscordId !== undefined) fixture.componentRef.setInput('currentUserDiscordId', opts.currentUserDiscordId);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── constructor effect ───────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads the roster for the guild/branch on first render', () => {
      setup();
      expect(rosterStore.loadRoster).toHaveBeenCalledWith('g1', 7);
    });
  });

  describe('#branchMembers', () => {
    it('falls back to an empty roster while the store has not loaded any members yet', () => {
      setup();
      rosterStore.members.set(null);
      expect(component.classFilterOptions()).toEqual([]);
    });
  });

  // ── classFilterOptions ───────────────────────────────────────────────────

  describe('classFilterOptions', () => {
    it('lists every distinct class present in the roster, alphabetically', () => {
      setup([member({ classId: 1 }), member({ characterId: 2, classId: 2 }), member({ characterId: 3, classId: 1 })]);
      expect(component.classFilterOptions().map((o) => o.value)).toEqual(expect.arrayContaining([1, 2]));
      expect(component.classFilterOptions()).toHaveLength(2);
    });
  });

  // ── specOptions / specFilterOptions ──────────────────────────────────────

  describe('specFilterOptions', () => {
    it('lists each distinct main spec once', () => {
      setup([
        member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }] }),
        member({ characterId: 2, raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }] }),
        member({ characterId: 3, raidSpecs: [{ specId: 65, name: 'Holy', iconUrl: null, isMain: true }] }),
      ]);

      expect(component.specFilterOptions().map((o) => o.value).sort()).toEqual([65, 71]);
    });

    it('ignores a character with no declared main spec', () => {
      setup([member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: false }] })]);
      expect(component.specFilterOptions()).toEqual([]);
    });
  });

  // ── rankFilterOptions ────────────────────────────────────────────────────

  describe('rankFilterOptions', () => {
    it('always offers Main/Split/Alt', () => {
      setup();
      expect(component.rankFilterOptions().map((o) => o.value)).toEqual([CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt]);
    });
  });

  // ── eventFilterOptions ───────────────────────────────────────────────────

  describe('eventFilterOptions', () => {
    it('sorts visible events by start date', () => {
      const early = raidEvent({ id: 1, name: 'Early', startsAtUtc: '2026-08-05T19:00:00Z' });
      const late = raidEvent({ id: 2, name: 'Late', startsAtUtc: '2026-08-09T19:00:00Z' });
      setup([], [late, early]);

      expect(component.eventFilterOptions()).toEqual([
        { value: 1, label: 'Early' },
        { value: 2, label: 'Late' },
      ]);
    });
  });

  // ── poolMembers ──────────────────────────────────────────────────────────

  describe('poolMembers', () => {
    it('includes a member eligible for at least one visible event', () => {
      setup([member()]);
      expect(component.poolMembers()).toHaveLength(1);
    });

    it('excludes a member declared absent for every visible event', () => {
      setup([member()], [raidEvent({ ineligiblePlayerDiscordIds: ['player-1'] })]);
      expect(component.poolMembers()).toEqual([]);
    });

    it('narrows to a specific event via targetEventFilter', () => {
      const e1 = raidEvent({ id: 1, ineligiblePlayerDiscordIds: ['player-1'] });
      const e2 = raidEvent({ id: 2 });
      setup([member()], [e1, e2]);

      component.targetEventFilter.set(1);
      expect(component.poolMembers()).toEqual([]);

      component.targetEventFilter.set(2);
      expect(component.poolMembers()).toHaveLength(1);
    });

    it('excludes everyone when targetEventFilter no longer matches any visible event', () => {
      setup([member()], [raidEvent({ id: 1 })]);
      component.targetEventFilter.set(99);
      expect(component.poolMembers()).toEqual([]);
    });

    it('filters by class', () => {
      setup([member({ classId: 1 }), member({ characterId: 2, classId: 2 })]);
      component.classFilter.set([2]);
      expect(component.poolMembers().map((m) => m.characterId)).toEqual([2]);
    });

    it('filters by main spec', () => {
      setup([
        member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }] }),
        member({ characterId: 2, raidSpecs: [{ specId: 65, name: 'Holy', iconUrl: null, isMain: true }] }),
      ]);
      component.specFilter.set([65]);
      expect(component.poolMembers().map((m) => m.characterId)).toEqual([2]);
    });

    it('filters by rank', () => {
      setup([member({ characterRank: CharacterRank.Main }), member({ characterId: 2, characterRank: CharacterRank.Alt })]);
      component.rankFilter.set([CharacterRank.Alt]);
      expect(component.poolMembers().map((m) => m.characterId)).toEqual([2]);
    });

    it('filters by search query on character or player name', () => {
      setup([member({ characterName: 'Addse', playerName: 'Dah Boo' }), member({ characterId: 2, characterName: 'Bylls', playerName: 'Other' })]);
      component.setSearch('add');
      expect(component.poolMembers().map((m) => m.characterId)).toEqual([1]);

      component.setSearch('dah');
      expect(component.poolMembers().map((m) => m.characterId)).toEqual([1]);
    });

    it('falls back to an empty player name when matching a character with no resolved player name', () => {
      setup([member({ characterName: 'Addse', playerName: null })]);
      component.setSearch('dah');
      expect(component.poolMembers()).toEqual([]);
    });

    it('sorts the result alphabetically by character name', () => {
      setup([member({ characterId: 2, characterName: 'Zul' }), member({ characterId: 1, characterName: 'Addse' })]);
      expect(component.poolMembers().map((m) => m.characterName)).toEqual(['Addse', 'Zul']);
    });
  });

  // ── hasActiveFilters ─────────────────────────────────────────────────────

  describe('hasActiveFilters', () => {
    it('is false with every filter at its default', () => {
      setup();
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('is true once any filter is set', () => {
      setup();
      component.setSearch('x');
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  // ── clearFilters ─────────────────────────────────────────────────────────

  describe('clearFilters', () => {
    it('resets every filter to its default', () => {
      setup();
      component.classFilter.set([1]);
      component.specFilter.set([71]);
      component.rankFilter.set([CharacterRank.Alt]);
      component.targetEventFilter.set(1);
      component.setSearch('x');

      component.clearFilters();

      expect(component.classFilter()).toEqual([]);
      expect(component.specFilter()).toEqual([]);
      expect(component.rankFilter()).toEqual([]);
      expect(component.targetEventFilter()).toBeUndefined();
      expect(component.searchQuery()).toBe('');
    });
  });

  // ── rejectEnter ──────────────────────────────────────────────────────────

  describe('rejectEnter', () => {
    it('always rejects', () => {
      setup();
      expect(component.rejectEnter()).toBe(false);
    });
  });

  // ── isOwnCharacter ───────────────────────────────────────────────────────

  describe('isOwnCharacter', () => {
    it('is true for the current viewer', () => {
      setup([], [raidEvent()], { currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(member({ playerDiscordId: 'player-1' }))).toBe(true);
    });

    it('is false for someone else', () => {
      setup([], [raidEvent()], { currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(member({ playerDiscordId: 'player-2' }))).toBe(false);
    });
  });

  // ── dragItem ─────────────────────────────────────────────────────────────

  describe('dragItem', () => {
    it('carries no fromSlot for a pool drag', () => {
      setup();
      expect(component.dragItem(member())).toEqual({
        characterId: 1,
        characterName: 'Addse',
        classId: 1,
        classColor: '#c79c6e',
        playerDiscordId: 'player-1',
      });
    });
  });

  // ── onDragStarted / onDragEnded ──────────────────────────────────────────

  describe('onDragStarted', () => {
    it('starts the drag with no origin slot', () => {
      setup();
      component.onDragStarted(member({ playerDiscordId: 'player-1', characterId: 1 }));
      expect(boardStore.startDrag).toHaveBeenCalledWith('player-1', 1);
    });
  });

  describe('onDragEnded', () => {
    it('ends the drag', () => {
      setup();
      component.onDragEnded();
      expect(boardStore.endDrag).toHaveBeenCalled();
    });
  });
});
