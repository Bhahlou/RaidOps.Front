import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RaidSignupListComponent } from './raid-signup-list.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';
import { SignupStatus } from '../../models/signup-status.enum';
import { RaidSignup } from '../../models/raid-signup.model';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
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
  signupMode: SignupMode.Signup,
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

const signup = (overrides?: Partial<RaidSignup>): RaidSignup => ({
  userDiscordId: 'player-1',
  playerName: 'Dah Boo',
  status: SignupStatus.Accepted,
  respondedAtUtc: '2026-08-01T00:00:00Z',
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  className: 'Warrior',
  specId: 71,
  specName: 'Arms',
  specIconUrl: null,
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

describe('RaidSignupListComponent', () => {
  let fixture: ComponentFixture<RaidSignupListComponent>;
  let component: RaidSignupListComponent;
  let boardStore: {
    getSignups: ReturnType<typeof vi.fn>;
    joinRaidSignupUpdates: ReturnType<typeof vi.fn>;
    leaveRaidSignupUpdates: ReturnType<typeof vi.fn>;
    onRaidSignupChanged: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    startDrag: ReturnType<typeof vi.fn>;
    endDrag: ReturnType<typeof vi.fn>;
  };
  let signupChangedCallback: ((eventId: number) => void) | undefined;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;

  const setup = (
    signups: RaidSignup[] = [],
    inputs?: { event?: RaidEvent; disabled?: boolean; currentUserDiscordId?: string | null },
  ) => {
    unsubscribeSpy = vi.fn();
    signupChangedCallback = undefined;
    boardStore = {
      getSignups: vi.fn().mockReturnValue(of(signups)),
      joinRaidSignupUpdates: vi.fn(),
      leaveRaidSignupUpdates: vi.fn(),
      onRaidSignupChanged: vi.fn((cb: (eventId: number) => void) => {
        signupChangedCallback = cb;
        return unsubscribeSpy;
      }),
      reload: vi.fn(),
      startDrag: vi.fn(),
      endDrag: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RaidSignupListComponent],
      providers: [{ provide: RaidBoardStore, useValue: boardStore }],
    }).overrideComponent(RaidSignupListComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidSignupListComponent);
    fixture.componentRef.setInput('event', inputs?.event ?? raidEvent());
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('guildBranchId', 10);
    if (inputs?.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
    if (inputs?.currentUserDiscordId !== undefined) fixture.componentRef.setInput('currentUserDiscordId', inputs.currentUserDiscordId);

    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── constructor / loading ────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads signups for the guild/branch/event on first render', () => {
      setup();
      expect(boardStore.getSignups).toHaveBeenCalledWith('g1', 10, 1);
    });

    it('joins the live-push group for the event', () => {
      setup();
      expect(boardStore.joinRaidSignupUpdates).toHaveBeenCalledWith('g1', 10, 1);
    });

    it('populates signups from the store response', () => {
      setup([signup()]);
      expect(component.signups()).toEqual([signup()]);
    });

    it('falls back to an empty list when the load fails', () => {
      boardStore = {
        getSignups: vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
        joinRaidSignupUpdates: vi.fn(),
        leaveRaidSignupUpdates: vi.fn(),
        onRaidSignupChanged: vi.fn().mockReturnValue(vi.fn()),
        reload: vi.fn(),
        startDrag: vi.fn(),
        endDrag: vi.fn(),
      };
      TestBed.configureTestingModule({
        imports: [RaidSignupListComponent],
        providers: [{ provide: RaidBoardStore, useValue: boardStore }],
      }).overrideComponent(RaidSignupListComponent, { set: { template: '', imports: [] } });
      fixture = TestBed.createComponent(RaidSignupListComponent);
      fixture.componentRef.setInput('event', raidEvent());
      fixture.componentRef.setInput('guildId', 'g1');
      fixture.componentRef.setInput('guildBranchId', 10);
      fixture.detectChanges();

      expect(fixture.componentInstance.signups()).toEqual([]);
    });
  });

  // ── live push (onRaidSignupChanged) ──────────────────────────────────────

  describe('live signup push', () => {
    it('reloads the board when the push is for this event', () => {
      setup();
      signupChangedCallback?.(1);
      expect(boardStore.reload).toHaveBeenCalledOnce();
    });

    it('ignores a push for a different event', () => {
      setup();
      signupChangedCallback?.(2);
      expect(boardStore.reload).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes from the live push and leaves the group', () => {
      const component = setup();
      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalledOnce();
      expect(boardStore.leaveRaidSignupUpdates).toHaveBeenCalledWith(10, 1);
    });

  });

  // ── status buckets ────────────────────────────────────────────────────────

  describe('status buckets', () => {
    it('splits signups into accepted/tentative/declined', () => {
      const component = setup([
        signup({ userDiscordId: 'p1', status: SignupStatus.Accepted }),
        signup({ userDiscordId: 'p2', status: SignupStatus.Tentative }),
        signup({ userDiscordId: 'p3', status: SignupStatus.Declined }),
      ]);

      expect(component.acceptedSignups().map((s) => s.userDiscordId)).toEqual(['p1']);
      expect(component.tentativeSignups().map((s) => s.userDiscordId)).toEqual(['p2']);
      expect(component.declinedSignups().map((s) => s.userDiscordId)).toEqual(['p3']);
    });
  });

  // ── assignedCharacterIds ──────────────────────────────────────────────────

  describe('assignedCharacterIds', () => {
    it('collects character ids already holding a slot in the event', () => {
      const component = setup([], { event: raidEvent({ assignments: [assignment({ characterId: 5 })] }) });
      expect(component.assignedCharacterIds()).toEqual(new Set([5]));
    });
  });

  // ── acceptedByClass ───────────────────────────────────────────────────────

  describe('acceptedByClass', () => {
    it('groups accepted signups by class, classes in ascending id order', () => {
      const component = setup([
        signup({ userDiscordId: 'p1', classId: 8, characterName: 'Jaina' }),
        signup({ userDiscordId: 'p2', classId: 1, characterName: 'Addse' }),
      ]);

      expect(component.acceptedByClass().map((g) => g.classId)).toEqual([1, 8]);
    });

    it('sorts characters within a class alphabetically', () => {
      const component = setup([
        signup({ userDiscordId: 'p1', classId: 1, characterName: 'Zeb' }),
        signup({ userDiscordId: 'p2', classId: 1, characterName: 'Addse' }),
      ]);

      expect(component.acceptedByClass()[0].signups.map((s) => s.characterName)).toEqual(['Addse', 'Zeb']);
    });

    it('sorts a signup with no resolved character name ahead of named ones', () => {
      const component = setup([
        signup({ userDiscordId: 'p1', classId: 1, characterName: 'Zeb' }),
        signup({ userDiscordId: 'p2', classId: 1, characterName: null }),
      ]);

      expect(component.acceptedByClass()[0].signups.map((s) => s.characterName)).toEqual([null, 'Zeb']);
    });

    it('sorts a named signup ahead when compared the other way around', () => {
      const component = setup([
        signup({ userDiscordId: 'p1', classId: 1, characterName: null }),
        signup({ userDiscordId: 'p2', classId: 1, characterName: 'Addse' }),
        signup({ userDiscordId: 'p3', classId: 1, characterName: 'Zeb' }),
      ]);

      expect(component.acceptedByClass()[0].signups.map((s) => s.characterName)).toEqual([null, 'Addse', 'Zeb']);
    });

    it('excludes accepted signups with no resolved class', () => {
      const component = setup([signup({ classId: null })]);
      expect(component.acceptedByClass()).toEqual([]);
    });

    it('excludes tentative/declined signups entirely', () => {
      const component = setup([signup({ status: SignupStatus.Tentative, classId: 1 })]);
      expect(component.acceptedByClass()).toEqual([]);
    });
  });

  // ── toggleExpanded ────────────────────────────────────────────────────────

  describe('toggleExpanded', () => {
    it('flips expanded from false to true and back', () => {
      const component = setup();
      expect(component.expanded()).toBe(false);

      component.toggleExpanded();
      expect(component.expanded()).toBe(true);

      component.toggleExpanded();
      expect(component.expanded()).toBe(false);
    });
  });

  // ── classColor ────────────────────────────────────────────────────────────

  describe('classColor', () => {
    it('returns the class color for a known classId', () => {
      const component = setup();
      expect(component.classColor(signup({ classId: 1 }))).toBe('#C79C6E');
    });

    it('falls back to "inherit" when classId is null', () => {
      const component = setup();
      expect(component.classColor(signup({ classId: null }))).toBe('inherit');
    });
  });

  // ── isOwnSignup ───────────────────────────────────────────────────────────

  describe('isOwnSignup', () => {
    it('is true when the signup belongs to the current user', () => {
      const component = setup([], { currentUserDiscordId: 'player-1' });
      expect(component.isOwnSignup(signup({ userDiscordId: 'player-1' }))).toBe(true);
    });

    it('is false for a different player', () => {
      const component = setup([], { currentUserDiscordId: 'player-1' });
      expect(component.isOwnSignup(signup({ userDiscordId: 'player-2' }))).toBe(false);
    });

    it('is false when currentUserDiscordId is not set', () => {
      const component = setup();
      expect(component.isOwnSignup(signup({ userDiscordId: 'player-1' }))).toBe(false);
    });
  });

  // ── isAlreadyAssigned ─────────────────────────────────────────────────────

  describe('isAlreadyAssigned', () => {
    it('is true when the signup\'s character already holds a slot', () => {
      const component = setup([], { event: raidEvent({ assignments: [assignment({ characterId: 1 })] }) });
      expect(component.isAlreadyAssigned(signup({ characterId: 1 }))).toBe(true);
    });

    it('is false when the character has no slot yet', () => {
      const component = setup([], { event: raidEvent({ assignments: [] }) });
      expect(component.isAlreadyAssigned(signup({ characterId: 1 }))).toBe(false);
    });

    it('is false when characterId is null', () => {
      const component = setup();
      expect(component.isAlreadyAssigned(signup({ characterId: null }))).toBe(false);
    });
  });

  // ── rejectEnter ───────────────────────────────────────────────────────────

  describe('rejectEnter', () => {
    it('always returns false', () => {
      const component = setup();
      expect(component.rejectEnter()).toBe(false);
    });
  });

  // ── dragItem ──────────────────────────────────────────────────────────────

  describe('dragItem', () => {
    it('builds a RaidDragItem from an accepted signup', () => {
      const component = setup();
      const item = component.dragItem(signup({ characterId: 1, characterName: 'Addse', classId: 1, userDiscordId: 'player-1' }));

      expect(item).toEqual({
        characterId: 1,
        characterName: 'Addse',
        classId: 1,
        classColor: '#C79C6E',
        playerDiscordId: 'player-1',
      });
    });

    it('falls back to an empty character name when unresolved', () => {
      const component = setup();
      const item = component.dragItem(signup({ characterName: null }));
      expect(item.characterName).toBe('');
    });
  });

  // ── onDragStarted / onDragEnded ───────────────────────────────────────────

  describe('onDragStarted / onDragEnded', () => {
    it('starts the drag with the signup\'s player and character', () => {
      const component = setup();
      component.onDragStarted(signup({ userDiscordId: 'player-1', characterId: 1 }));
      expect(boardStore.startDrag).toHaveBeenCalledWith('player-1', 1);
    });

    it('ends the drag', () => {
      const component = setup();
      component.onDragEnded();
      expect(boardStore.endDrag).toHaveBeenCalledOnce();
    });
  });
});
