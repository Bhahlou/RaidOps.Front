import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaidAvailableRosterComponent } from './raid-available-roster.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { GuildRosterMember } from '../../../models/guild-roster-member.model';
import { CharacterRank } from '../../../models/character-rank.enum';
import { DayAvailabilityStatus } from '../../../../calendar/models/day-availability-status.enum';

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
  raidZones: [],
  assignments: [],
  ineligiblePlayerDiscordIds: [],
  mySignupStatus: null,
  mySignupCharacterId: null,
  mySignupSpecId: null,
  acceptedCharacterIdsByPlayerDiscordId: {},
  dedicatedAnnouncementChannelId: null,
  dedicatedAnnouncementChannelIsBotOwned: false,
  ...overrides,
});

const assignment = (overrides?: Partial<RaidSlotAssignment>): RaidSlotAssignment => ({
  groupNumber: 1,
  slotNumber: 1,
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  classColor: '#c79c6e',
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  availabilityStatus: DayAvailabilityStatus.Available,
  spec: { id: 1, name: 'Fury', iconUrl: null },
  availableSpecs: [{ id: 1, name: 'Fury', iconUrl: null }],
  ...overrides,
});

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
  raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: 'arms.png', isMain: true }],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
  canExclude: true,
  ...overrides,
});

describe('RaidAvailableRosterComponent', () => {
  let fixture: ComponentFixture<RaidAvailableRosterComponent>;
  let component: RaidAvailableRosterComponent;
  let boardStore: { startDrag: ReturnType<typeof vi.fn>; endDrag: ReturnType<typeof vi.fn> };

  const setup = (inputs?: {
    event?: RaidEvent;
    rosterMembers?: GuildRosterMember[];
    disabled?: boolean;
    currentUserDiscordId?: string | null;
    initiallyExpanded?: boolean;
  }) => {
    boardStore = { startDrag: vi.fn(), endDrag: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RaidAvailableRosterComponent],
      providers: [{ provide: RaidBoardStore, useValue: boardStore }],
    }).overrideComponent(RaidAvailableRosterComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidAvailableRosterComponent);
    fixture.componentRef.setInput('event', inputs?.event ?? raidEvent());
    if (inputs?.rosterMembers !== undefined) fixture.componentRef.setInput('rosterMembers', inputs.rosterMembers);
    if (inputs?.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
    if (inputs?.currentUserDiscordId !== undefined) fixture.componentRef.setInput('currentUserDiscordId', inputs.currentUserDiscordId);
    if (inputs?.initiallyExpanded !== undefined) fixture.componentRef.setInput('initiallyExpanded', inputs.initiallyExpanded);

    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── availableMembers ─────────────────────────────────────────────────────

  describe('availableMembers', () => {
    it('excludes players declared ineligible for the event', () => {
      const component = setup({
        rosterMembers: [member({ characterId: 1, playerDiscordId: 'p1' }), member({ characterId: 2, playerDiscordId: 'p2' })],
        event: raidEvent({ ineligiblePlayerDiscordIds: ['p2'] }),
      });

      expect(component.availableMembers().map((m) => m.characterId)).toEqual([1]);
    });

    it('narrows by the selected ranks when the filter is active', () => {
      const component = setup({
        rosterMembers: [
          member({ characterId: 1, characterRank: CharacterRank.Main }),
          member({ characterId: 2, characterRank: CharacterRank.Alt }),
        ],
      });

      component.toggleRank(CharacterRank.Alt);

      expect(component.availableMembers().map((m) => m.characterId)).toEqual([2]);
    });

    it('applies no rank filter when none is selected', () => {
      const component = setup({
        rosterMembers: [member({ characterId: 1, characterRank: CharacterRank.Main }), member({ characterId: 2, characterRank: CharacterRank.Alt })],
      });

      expect(component.availableMembers().map((m) => m.characterId)).toEqual([1, 2]);
    });
  });

  // ── unavailablePlayers ───────────────────────────────────────────────────

  describe('unavailablePlayers', () => {
    it('collapses a declared-absent player\'s characters to one row', () => {
      const component = setup({
        rosterMembers: [
          member({ characterId: 1, playerDiscordId: 'p1', playerName: 'Dah Boo' }),
          member({ characterId: 2, playerDiscordId: 'p1', playerName: 'Dah Boo' }),
        ],
        event: raidEvent({ ineligiblePlayerDiscordIds: ['p1'] }),
      });

      expect(component.unavailablePlayers()).toEqual([{ playerDiscordId: 'p1', playerName: 'Dah Boo' }]);
    });

    it('falls back to the discord id when the player has no resolved name', () => {
      const component = setup({
        rosterMembers: [member({ playerDiscordId: 'p1', playerName: null })],
        event: raidEvent({ ineligiblePlayerDiscordIds: ['p1'] }),
      });

      expect(component.unavailablePlayers()).toEqual([{ playerDiscordId: 'p1', playerName: 'p1' }]);
    });

    it('sorts alphabetically by player name', () => {
      const component = setup({
        rosterMembers: [
          member({ playerDiscordId: 'p1', playerName: 'Zeb' }),
          member({ characterId: 2, playerDiscordId: 'p2', playerName: 'Addse' }),
        ],
        event: raidEvent({ ineligiblePlayerDiscordIds: ['p1', 'p2'] }),
      });

      expect(component.unavailablePlayers().map((p) => p.playerName)).toEqual(['Addse', 'Zeb']);
    });

    it('is empty when nobody is declared unavailable', () => {
      const component = setup({ rosterMembers: [member()] });
      expect(component.unavailablePlayers()).toEqual([]);
    });
  });

  // ── availableByClass ─────────────────────────────────────────────────────

  describe('availableByClass', () => {
    it('groups available members by class, classes in ascending id order', () => {
      const component = setup({
        rosterMembers: [member({ characterId: 1, classId: 8, characterName: 'Jaina' }), member({ characterId: 2, classId: 1, characterName: 'Addse' })],
      });

      expect(component.availableByClass().map((g) => g.classId)).toEqual([1, 8]);
    });

    it('sorts characters within a class alphabetically', () => {
      const component = setup({
        rosterMembers: [member({ characterId: 1, classId: 1, characterName: 'Zeb' }), member({ characterId: 2, classId: 1, characterName: 'Addse' })],
      });

      expect(component.availableByClass()[0].members.map((m) => m.characterName)).toEqual(['Addse', 'Zeb']);
    });

    it('resolves a known class icon and falls back to null for an unknown classId', () => {
      const component = setup({ rosterMembers: [member({ classId: 1 }), member({ characterId: 2, classId: 9999 })] });

      const byClassId = new Map(component.availableByClass().map((g) => [g.classId, g.iconUrl]));
      expect(byClassId.get(1)).toContain('classicon_warrior');
      expect(byClassId.get(9999)).toBeNull();
    });

    it('is empty when there are no roster members', () => {
      expect(setup({ rosterMembers: [] }).availableByClass()).toEqual([]);
    });
  });

  // ── toggleExpanded ────────────────────────────────────────────────────────

  describe('toggleExpanded', () => {
    it('defaults to collapsed and flips on toggle', () => {
      const component = setup();
      expect(component.expanded()).toBe(false);

      component.toggleExpanded();
      expect(component.expanded()).toBe(true);

      component.toggleExpanded();
      expect(component.expanded()).toBe(false);
    });

    it('starts expanded when initiallyExpanded is true', () => {
      expect(setup({ initiallyExpanded: true }).expanded()).toBe(true);
    });
  });

  // ── isRankSelected / toggleRank ───────────────────────────────────────────

  describe('isRankSelected / toggleRank', () => {
    it('is false for a rank not yet selected', () => {
      expect(setup().isRankSelected(CharacterRank.Main)).toBe(false);
    });

    it('adds the rank to the filter on toggle', () => {
      const component = setup();
      component.toggleRank(CharacterRank.Main);
      expect(component.isRankSelected(CharacterRank.Main)).toBe(true);
    });

    it('removes the rank from the filter when toggled again', () => {
      const component = setup();
      component.toggleRank(CharacterRank.Main);
      component.toggleRank(CharacterRank.Main);
      expect(component.isRankSelected(CharacterRank.Main)).toBe(false);
    });
  });

  // ── mainSpecIconUrl ───────────────────────────────────────────────────────

  describe('mainSpecIconUrl', () => {
    it('resolves the icon of the main-flagged spec', () => {
      const component = setup();
      expect(component.mainSpecIconUrl(member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: 'arms.png', isMain: true }] }))).toBe('arms.png');
    });

    it('is null when the character has no main spec', () => {
      const component = setup();
      expect(component.mainSpecIconUrl(member({ raidSpecs: [] }))).toBeNull();
    });
  });

  // ── isOwnCharacter ────────────────────────────────────────────────────────

  describe('isOwnCharacter', () => {
    it('is true when the character belongs to the current user', () => {
      const component = setup({ currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(member({ playerDiscordId: 'player-1' }))).toBe(true);
    });

    it('is false for a different player', () => {
      const component = setup({ currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(member({ playerDiscordId: 'player-2' }))).toBe(false);
    });

    it('is false when currentUserDiscordId is not set', () => {
      const component = setup();
      expect(component.isOwnCharacter(member({ playerDiscordId: 'player-1' }))).toBe(false);
    });
  });

  // ── isAlreadyAssigned ─────────────────────────────────────────────────────

  describe('isAlreadyAssigned', () => {
    it('is true when the character already holds a slot', () => {
      const component = setup({ event: raidEvent({ assignments: [assignment({ characterId: 1 })] }) });
      expect(component.isAlreadyAssigned(member({ characterId: 1 }))).toBe(true);
    });

    it('is false when the character has no slot yet', () => {
      const component = setup({ event: raidEvent({ assignments: [] }) });
      expect(component.isAlreadyAssigned(member({ characterId: 1 }))).toBe(false);
    });
  });

  // ── rejectEnter ───────────────────────────────────────────────────────────

  describe('rejectEnter', () => {
    it('always returns false', () => {
      expect(setup().rejectEnter()).toBe(false);
    });
  });

  // ── dragItem ──────────────────────────────────────────────────────────────

  describe('dragItem', () => {
    it('builds a RaidDragItem from a roster member', () => {
      const component = setup();
      const item = component.dragItem(member({ characterId: 1, characterName: 'Addse', classId: 1, classColor: '#c79c6e', playerDiscordId: 'player-1' }));

      expect(item).toEqual({
        characterId: 1,
        characterName: 'Addse',
        classId: 1,
        classColor: '#c79c6e',
        playerDiscordId: 'player-1',
      });
    });
  });

  // ── onDragStarted / onDragEnded ───────────────────────────────────────────

  describe('onDragStarted / onDragEnded', () => {
    it('starts the drag with the member\'s player and character', () => {
      const component = setup();
      component.onDragStarted(member({ playerDiscordId: 'player-1', characterId: 1 }));
      expect(boardStore.startDrag).toHaveBeenCalledWith('player-1', 1);
    });

    it('ends the drag', () => {
      const component = setup();
      component.onDragEnded();
      expect(boardStore.endDrag).toHaveBeenCalledOnce();
    });
  });
});
