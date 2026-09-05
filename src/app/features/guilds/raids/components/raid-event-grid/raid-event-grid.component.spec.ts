import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RaidEventGridComponent } from './raid-event-grid.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { DayAvailabilityStatus } from '../../../../calendar/models/day-availability-status.enum';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { SignupMode } from '../../models/signup-mode.enum';

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
  availableSpecs: [],
  signupStatus: null,
  ...overrides,
});

const raidEvent = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 1,
  raidSeriesId: null,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 2,
  slotsPerGroup: 3,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [{ id: 10, name: 'Serpentshrine Cavern', shortCode: 'SSC' }],
  assignments: [],
  ineligiblePlayerDiscordIds: [],
  mySignupStatus: null,
  mySignupCharacterId: null,
  mySignupSpecId: null,
  acceptedCharacterIdsByPlayerDiscordId: {},
  dedicatedAnnouncementChannelId: null,
  dedicatedAnnouncementChannelIsBotOwned: false,
  extendsRaidEventId: null,
  extendsRaidEventName: null,
  ...overrides,
});

const dragItem = (overrides?: Partial<RaidDragItem>): RaidDragItem => ({
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  classColor: '#c79c6e',
  playerDiscordId: 'player-1',
  ...overrides,
});

describe('RaidEventGridComponent', () => {
  let fixture: ComponentFixture<RaidEventGridComponent>;
  let component: RaidEventGridComponent;
  let store: {
    swapSlotAssignments: ReturnType<typeof vi.fn>;
    unassignSlot: ReturnType<typeof vi.fn>;
    assignSlot: ReturnType<typeof vi.fn>;
    updateSlotSpec: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let snackbar: { error: ReturnType<typeof vi.fn> };

  const setup = (event: RaidEvent, opts?: { disabled?: boolean; allEvents?: RaidEvent[] }) => {
    store = {
      swapSlotAssignments: vi.fn().mockReturnValue(of(undefined)),
      unassignSlot: vi.fn().mockReturnValue(of(undefined)),
      assignSlot: vi.fn().mockReturnValue(of(undefined)),
      updateSlotSpec: vi.fn().mockReturnValue(of(undefined)),
      reload: vi.fn(),
    };
    snackbar = { error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RaidEventGridComponent],
      providers: [
        { provide: RaidBoardStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
      ],
    }).overrideComponent(RaidEventGridComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidEventGridComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('guildBranchId', 7);
    fixture.componentRef.setInput('event', event);
    if (opts?.disabled !== undefined) fixture.componentRef.setInput('disabled', opts.disabled);
    if (opts?.allEvents) fixture.componentRef.setInput('allEvents', opts.allEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── groupNumbers / slotNumbers ───────────────────────────────────────────

  describe('groupNumbers / slotNumbers', () => {
    it('ranges over the event grid dimensions', () => {
      setup(raidEvent({ groupCount: 2, slotsPerGroup: 3 }));

      expect(component.groupNumbers()).toEqual([1, 2]);
      expect(component.slotNumbers()).toEqual([1, 2, 3]);
    });
  });

  // ── assignmentFor ────────────────────────────────────────────────────────

  describe('assignmentFor', () => {
    it('returns the assignment at the given coordinates', () => {
      const a = assignment({ groupNumber: 2, slotNumber: 3 });
      setup(raidEvent({ assignments: [a] }));

      expect(component.assignmentFor(2, 3)).toEqual(a);
    });

    it('returns null when no assignment occupies the coordinates', () => {
      setup(raidEvent({ assignments: [] }));
      expect(component.assignmentFor(2, 3)).toBeNull();
    });
  });

  // ── slotDropListId ───────────────────────────────────────────────────────

  describe('slotDropListId', () => {
    it('formats the drop list id from event and slot coordinates', () => {
      setup(raidEvent({ id: 9 }));
      expect(component.slotDropListId(2, 3)).toBe('raid-slot-9-2-3');
    });
  });

  // ── assignableCharacters / lockedCharacterEventIds / playerAssignedCharacterIds ──

  describe('derived per-event maps', () => {
    it('computes assignableCharacters from the roster and visible events', () => {
      setup(raidEvent());
      expect(component.assignableCharacters()).toEqual([]);
    });

    it('computes lockedCharacterEventIds from other loaded events sharing a raid zone', () => {
      const other = raidEvent({ id: 2, assignments: [assignment({ characterId: 5 })] });
      setup(raidEvent(), { allEvents: [raidEvent(), other] });

      expect(component.lockedCharacterEventIds().get(5)).toEqual(new Set([2]));
    });

    it('computes playerAssignedCharacterIds from this event alone', () => {
      setup(raidEvent({ assignments: [assignment({ playerDiscordId: 'player-1', characterId: 1 })] }));

      expect(component.playerAssignedCharacterIds().get('player-1')).toBe(1);
    });
  });

  // ── onDropped ────────────────────────────────────────────────────────────

  describe('onDropped', () => {
    it('does nothing when the viewer is disabled', () => {
      setup(raidEvent(), { disabled: true });

      component.onDropped(dragItem(), 1, 1);

      expect(store.assignSlot).not.toHaveBeenCalled();
      expect(store.swapSlotAssignments).not.toHaveBeenCalled();
      expect(store.unassignSlot).not.toHaveBeenCalled();
    });

    it('swaps when a same-event drag lands on an occupied slot', () => {
      setup(raidEvent({ id: 1, assignments: [assignment({ groupNumber: 1, slotNumber: 1 })] }));

      component.onDropped(dragItem({ fromSlot: { eventId: 1, groupNumber: 2, slotNumber: 3 } }), 1, 1);

      expect(store.swapSlotAssignments).toHaveBeenCalledWith('g1', 7, 1, 2, 3, 1, 1);
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a snackbar error when the swap fails', () => {
      setup(raidEvent({ id: 1, assignments: [assignment({ groupNumber: 1, slotNumber: 1 })] }));
      store.swapSlotAssignments.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'SlotOccupied' } })));

      component.onDropped(dragItem({ fromSlot: { eventId: 1, groupNumber: 2, slotNumber: 3 } }), 1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.slotOccupied');
    });

    it('retracts the source slot then assigns the target for a cross-raid lockout move', () => {
      const other = raidEvent({ id: 2, assignments: [assignment({ characterId: 1, groupNumber: 4, slotNumber: 5 })] });
      setup(raidEvent({ id: 1 }), { allEvents: [raidEvent({ id: 1 }), other] });

      component.onDropped(dragItem({ characterId: 1, fromSlot: { eventId: 2, groupNumber: 4, slotNumber: 5 } }), 1, 1);

      expect(store.unassignSlot).toHaveBeenCalledWith('g1', 7, 2, 4, 5);
      expect(store.assignSlot).toHaveBeenCalledWith('g1', 7, 1, 1, 1, 1);
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a snackbar error when retracting the source slot fails, without assigning the target', () => {
      const other = raidEvent({ id: 2, assignments: [assignment({ characterId: 1, groupNumber: 4, slotNumber: 5 })] });
      setup(raidEvent({ id: 1 }), { allEvents: [raidEvent({ id: 1 }), other] });
      store.unassignSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventNotFound' } })));

      component.onDropped(dragItem({ characterId: 1, fromSlot: { eventId: 2, groupNumber: 4, slotNumber: 5 } }), 1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidEventNotFound');
      expect(store.assignSlot).not.toHaveBeenCalled();
    });

    it('plainly assigns when the drag has no origin slot (roster pool)', () => {
      setup(raidEvent({ id: 1 }));

      component.onDropped(dragItem({ fromSlot: undefined }), 1, 1);

      expect(store.assignSlot).toHaveBeenCalledWith('g1', 7, 1, 1, 1, 1);
      expect(store.reload).toHaveBeenCalled();
    });

    it('plainly assigns when the drag originates from an event sharing no lockout zone', () => {
      const other = raidEvent({ id: 2, raidZones: [{ id: 99, name: 'Karazhan', shortCode: 'Kara' }], assignments: [assignment({ characterId: 1 })] });
      setup(raidEvent({ id: 1 }), { allEvents: [raidEvent({ id: 1 }), other] });

      component.onDropped(dragItem({ characterId: 1, fromSlot: { eventId: 2, groupNumber: 1, slotNumber: 1 } }), 1, 1);

      expect(store.unassignSlot).not.toHaveBeenCalled();
      expect(store.assignSlot).toHaveBeenCalledWith('g1', 7, 1, 1, 1, 1);
    });

    it('shows a snackbar error when the plain assign fails', () => {
      setup(raidEvent({ id: 1 }));
      store.assignSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'CharacterNotOnRoster' } })));

      component.onDropped(dragItem({ fromSlot: undefined }), 1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.characterNotOnRoster');
    });
  });

  // ── onUnassign ───────────────────────────────────────────────────────────

  describe('onUnassign', () => {
    it('does nothing when the viewer is disabled', () => {
      setup(raidEvent(), { disabled: true });
      component.onUnassign(1, 1);
      expect(store.unassignSlot).not.toHaveBeenCalled();
    });

    it('unassigns then reloads on success', () => {
      setup(raidEvent({ id: 1 }));
      component.onUnassign(1, 1);
      expect(store.unassignSlot).toHaveBeenCalledWith('g1', 7, 1, 1, 1);
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a snackbar error on failure', () => {
      setup(raidEvent({ id: 1 }));
      store.unassignSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'InvalidGroupOrSlotNumber' } })));
      component.onUnassign(1, 1);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.invalidGroupOrSlotNumber');
    });
  });

  // ── onSpecChanged ────────────────────────────────────────────────────────

  describe('onSpecChanged', () => {
    it('does nothing when the viewer is disabled', () => {
      setup(raidEvent(), { disabled: true });
      component.onSpecChanged(65, 1, 1);
      expect(store.updateSlotSpec).not.toHaveBeenCalled();
    });

    it('updates the spec then reloads on success', () => {
      setup(raidEvent({ id: 1 }));
      component.onSpecChanged(65, 1, 1);
      expect(store.updateSlotSpec).toHaveBeenCalledWith('g1', 7, 1, 1, 1, 65);
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a snackbar error on failure', () => {
      setup(raidEvent({ id: 1 }));
      store.updateSlotSpec.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'CharacterNotOnRoster' } })));
      component.onSpecChanged(65, 1, 1);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.characterNotOnRoster');
    });
  });
});
