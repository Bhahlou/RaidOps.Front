import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';

import { RaidSlotComponent } from './raid-slot.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { AssignableCharacter, LockedCharacterEventIds } from '../../utils/assignable-characters.util';

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

const assignableCharacter = (overrides?: Partial<AssignableCharacter>): AssignableCharacter => ({
  characterId: 2,
  characterName: 'Bylls',
  classId: 2,
  classColor: '#69ccf0',
  playerDiscordId: 'player-2',
  ...overrides,
});

describe('RaidSlotComponent', () => {
  let fixture: ComponentFixture<RaidSlotComponent>;
  let component: RaidSlotComponent;
  let boardStore: {
    draggingPlayerDiscordId: ReturnType<typeof signal<string | null>>;
    draggingCharacterId: ReturnType<typeof signal<number | null>>;
    draggingFromSlot: ReturnType<typeof signal<{ eventId: number; groupNumber: number; slotNumber: number } | null>>;
    startDrag: ReturnType<typeof vi.fn>;
    endDrag: ReturnType<typeof vi.fn>;
  };

  const setup = (inputs?: {
    eventId?: number;
    groupNumber?: number;
    slotNumber?: number;
    assignment?: RaidSlotAssignment | null;
    absentPlayerDiscordIds?: string[];
    lockedCharacterEventIds?: LockedCharacterEventIds;
    playerAssignedCharacterIds?: ReadonlyMap<string, number>;
    disabled?: boolean;
    currentUserDiscordId?: string | null;
    assignableCharacters?: AssignableCharacter[];
  }) => {
    boardStore = {
      draggingPlayerDiscordId: signal<string | null>(null),
      draggingCharacterId: signal<number | null>(null),
      draggingFromSlot: signal<{ eventId: number; groupNumber: number; slotNumber: number } | null>(null),
      startDrag: vi.fn(),
      endDrag: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RaidSlotComponent],
      providers: [{ provide: RaidBoardStore, useValue: boardStore }],
    }).overrideComponent(RaidSlotComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidSlotComponent);
    fixture.componentRef.setInput('eventId', inputs?.eventId ?? 1);
    fixture.componentRef.setInput('groupNumber', inputs?.groupNumber ?? 1);
    fixture.componentRef.setInput('slotNumber', inputs?.slotNumber ?? 1);
    fixture.componentRef.setInput('dropListId', 'slot-1-1-1');
    if (inputs?.assignment !== undefined) fixture.componentRef.setInput('assignment', inputs.assignment);
    if (inputs?.absentPlayerDiscordIds) fixture.componentRef.setInput('absentPlayerDiscordIds', inputs.absentPlayerDiscordIds);
    if (inputs?.lockedCharacterEventIds) fixture.componentRef.setInput('lockedCharacterEventIds', inputs.lockedCharacterEventIds);
    if (inputs?.playerAssignedCharacterIds) fixture.componentRef.setInput('playerAssignedCharacterIds', inputs.playerAssignedCharacterIds);
    if (inputs?.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
    if (inputs?.currentUserDiscordId !== undefined) fixture.componentRef.setInput('currentUserDiscordId', inputs.currentUserDiscordId);
    if (inputs?.assignableCharacters) fixture.componentRef.setInput('assignableCharacters', inputs.assignableCharacters);

    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── isBlockedForDrag ─────────────────────────────────────────────────────

  describe('isBlockedForDrag', () => {
    it('is false when no drag is in progress', () => {
      setup();
      expect(component.isBlockedForDrag()).toBe(false);
    });

    it('is true when the dragging player is declared absent for this event', () => {
      setup({ absentPlayerDiscordIds: ['player-1'] });
      boardStore.draggingPlayerDiscordId.set('player-1');

      expect(component.isBlockedForDrag()).toBe(true);
    });

    it('is true when the dragging character is locked by more than one other event', () => {
      setup({ lockedCharacterEventIds: new Map([[42, new Set([2, 3])]]) });
      boardStore.draggingCharacterId.set(42);
      boardStore.draggingFromSlot.set({ eventId: 2, groupNumber: 1, slotNumber: 1 });

      expect(component.isBlockedForDrag()).toBe(true);
    });

    it('is true when the dragging character is locked and the drag did not originate from the locking event', () => {
      setup({ lockedCharacterEventIds: new Map([[42, new Set([2])]]) });
      boardStore.draggingCharacterId.set(42);
      boardStore.draggingFromSlot.set(null); // dragged from the roster pool, not from event 2

      expect(component.isBlockedForDrag()).toBe(true);
    });

    it('is false — a move — when the dragging character is locked only by the event it is being dragged out of', () => {
      setup({ lockedCharacterEventIds: new Map([[42, new Set([2])]]) });
      boardStore.draggingCharacterId.set(42);
      boardStore.draggingFromSlot.set({ eventId: 2, groupNumber: 1, slotNumber: 1 });

      expect(component.isBlockedForDrag()).toBe(false);
    });

    it('is true when the dragging player already holds a different character slot in this event', () => {
      setup({ playerAssignedCharacterIds: new Map([['player-1', 99]]) });
      boardStore.draggingPlayerDiscordId.set('player-1');
      boardStore.draggingCharacterId.set(42);

      expect(component.isBlockedForDrag()).toBe(true);
    });

    it('is false when repositioning the player\'s own already-seated character', () => {
      setup({ playerAssignedCharacterIds: new Map([['player-1', 42]]) });
      boardStore.draggingPlayerDiscordId.set('player-1');
      boardStore.draggingCharacterId.set(42);

      expect(component.isBlockedForDrag()).toBe(false);
    });
  });

  // ── dropDisabled ─────────────────────────────────────────────────────────

  describe('dropDisabled', () => {
    it('mirrors the disabled input', () => {
      setup({ disabled: true });
      expect(component.dropDisabled()).toBe(true);
    });

    it('is false when the viewer is an officer', () => {
      setup({ disabled: false });
      expect(component.dropDisabled()).toBe(false);
    });
  });

  // ── canReceiveDrop ───────────────────────────────────────────────────────

  describe('canReceiveDrop', () => {
    const drag = (data: Partial<RaidDragItem>) => ({ data } as CdkDrag<RaidDragItem>);

    it('rejects when the viewer is disabled', () => {
      setup({ disabled: true });
      expect(component.canReceiveDrop(drag({ characterId: 1 }))).toBe(false);
    });

    it('rejects when the drop target is blocked for the current drag', () => {
      setup({ absentPlayerDiscordIds: ['player-1'] });
      boardStore.draggingPlayerDiscordId.set('player-1');

      expect(component.canReceiveDrop(drag({ characterId: 1 }))).toBe(false);
    });

    it('accepts anything on an empty slot once past the blocking checks', () => {
      setup({ assignment: null });
      expect(component.canReceiveDrop(drag({ characterId: 1 }))).toBe(true);
    });

    it('rejects an occupied slot when the drag has no origin slot (pool drag)', () => {
      setup({ assignment: assignment() });
      expect(component.canReceiveDrop(drag({ characterId: 1 }))).toBe(false);
    });

    it('rejects an occupied slot when the drag carries no data at all', () => {
      setup({ assignment: assignment() });
      expect(component.canReceiveDrop({ data: undefined } as unknown as CdkDrag<RaidDragItem>)).toBe(false);
    });

    it('rejects an occupied slot when the drag originates from a different event', () => {
      setup({ eventId: 1, assignment: assignment() });
      expect(component.canReceiveDrop(drag({ characterId: 1, fromSlot: { eventId: 2, groupNumber: 1, slotNumber: 1 } }))).toBe(false);
    });

    it('rejects an occupied slot when the drag is dropped back onto its own coordinates', () => {
      setup({ eventId: 1, groupNumber: 1, slotNumber: 1, assignment: assignment() });
      expect(component.canReceiveDrop(drag({ characterId: 1, fromSlot: { eventId: 1, groupNumber: 1, slotNumber: 1 } }))).toBe(false);
    });

    it('accepts a same-event drag from a different slot onto an occupied slot (swap)', () => {
      setup({ eventId: 1, groupNumber: 1, slotNumber: 1, assignment: assignment() });
      expect(component.canReceiveDrop(drag({ characterId: 1, fromSlot: { eventId: 1, groupNumber: 2, slotNumber: 3 } }))).toBe(true);
    });
  });

  // ── canChangeSpec ────────────────────────────────────────────────────────

  describe('canChangeSpec', () => {
    it('is true when not disabled and the character has more than one raid spec', () => {
      setup({ disabled: false });
      const a = assignment({ availableSpecs: [{ id: 1, name: 'Fury', iconUrl: null }, { id: 2, name: 'Arms', iconUrl: null }] });

      expect(component.canChangeSpec(a)).toBe(true);
    });

    it('is false when disabled', () => {
      setup({ disabled: true });
      const a = assignment({ availableSpecs: [{ id: 1, name: 'Fury', iconUrl: null }, { id: 2, name: 'Arms', iconUrl: null }] });

      expect(component.canChangeSpec(a)).toBe(false);
    });

    it('is false when the character has only one declared raid spec', () => {
      setup({ disabled: false });
      expect(component.canChangeSpec(assignment({ availableSpecs: [{ id: 1, name: 'Fury', iconUrl: null }] }))).toBe(false);
    });
  });

  // ── isOwnCharacter ───────────────────────────────────────────────────────

  describe('isOwnCharacter', () => {
    it('is true when the assignment belongs to the current viewer', () => {
      setup({ currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(assignment({ playerDiscordId: 'player-1' }))).toBe(true);
    });

    it('is false when the assignment belongs to someone else', () => {
      setup({ currentUserDiscordId: 'player-1' });
      expect(component.isOwnCharacter(assignment({ playerDiscordId: 'player-2' }))).toBe(false);
    });

    it('is false when there is no current viewer', () => {
      setup({ currentUserDiscordId: null });
      expect(component.isOwnCharacter(assignment({ playerDiscordId: 'player-1' }))).toBe(false);
    });
  });

  // ── onSpecSelected ───────────────────────────────────────────────────────

  describe('onSpecSelected', () => {
    it('emits specChanged with the picked spec id', () => {
      setup();
      const spy = vi.fn();
      component.specChanged.subscribe(spy);

      component.onSpecSelected(65);

      expect(spy).toHaveBeenCalledWith(65);
    });
  });

  // ── filteredAssignableCharacters ─────────────────────────────────────────

  describe('filteredAssignableCharacters', () => {
    it('returns every assignable character when the query is empty', () => {
      setup({ assignableCharacters: [assignableCharacter({ characterName: 'Bylls' }), assignableCharacter({ characterId: 3, characterName: 'Griffe' })] });
      expect(component.filteredAssignableCharacters()).toHaveLength(2);
    });

    it('filters case-insensitively and trims the query', () => {
      setup({ assignableCharacters: [assignableCharacter({ characterName: 'Bylls' }), assignableCharacter({ characterId: 3, characterName: 'Griffe' })] });

      component.assignQuery.set('  BYL  ');

      expect(component.filteredAssignableCharacters()).toEqual([expect.objectContaining({ characterName: 'Bylls' })]);
    });
  });

  // ── onAssignMenuOpened ───────────────────────────────────────────────────

  describe('onAssignMenuOpened', () => {
    it('resets the search query and does not throw with no search input rendered', () => {
      vi.useFakeTimers();
      setup();
      component.assignQuery.set('stale');

      component.onAssignMenuOpened();
      vi.runAllTimers();

      expect(component.assignQuery()).toBe('');
      vi.useRealTimers();
    });

    it('focuses the search input once rendered', () => {
      vi.useFakeTimers();
      setup();
      const focus = vi.fn();
      (component as unknown as { assignSearchInputRef: () => { nativeElement: { focus: () => void } } | undefined }).assignSearchInputRef = () => ({
        nativeElement: { focus },
      });

      component.onAssignMenuOpened();
      vi.runAllTimers();

      expect(focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ── onCharacterPicked ────────────────────────────────────────────────────

  describe('onCharacterPicked', () => {
    it('emits dropped with the picked character, no fromSlot', () => {
      setup();
      const spy = vi.fn();
      component.dropped.subscribe(spy);

      component.onCharacterPicked(assignableCharacter());

      expect(spy).toHaveBeenCalledWith({
        characterId: 2,
        characterName: 'Bylls',
        classId: 2,
        classColor: '#69ccf0',
        playerDiscordId: 'player-2',
      });
    });
  });

  // ── dragItem ─────────────────────────────────────────────────────────────

  describe('dragItem', () => {
    it('stamps the slot coordinates as fromSlot', () => {
      setup({ eventId: 5, groupNumber: 2, slotNumber: 3 });

      expect(component.dragItem(assignment())).toEqual({
        characterId: 1,
        characterName: 'Addse',
        classId: 1,
        classColor: '#c79c6e',
        playerDiscordId: 'player-1',
        fromSlot: { eventId: 5, groupNumber: 2, slotNumber: 3 },
      });
    });
  });

  // ── onDropped ────────────────────────────────────────────────────────────

  describe('onDropped', () => {
    it('emits dropped with the dragged item data', () => {
      setup();
      const spy = vi.fn();
      component.dropped.subscribe(spy);
      const item: RaidDragItem = { characterId: 1, characterName: 'Addse', classId: 1, classColor: '#c79c6e', playerDiscordId: 'player-1' };

      component.onDropped({ item: { data: item } } as CdkDragDrop<RaidSlotAssignment | null, unknown, RaidDragItem>);

      expect(spy).toHaveBeenCalledWith(item);
    });
  });

  // ── onDragStarted / onDragEnded ──────────────────────────────────────────

  describe('onDragStarted', () => {
    it('starts the drag with the assignment player/character and this slot as origin', () => {
      setup({ eventId: 5, groupNumber: 2, slotNumber: 3 });

      component.onDragStarted(assignment({ playerDiscordId: 'player-1', characterId: 1 }));

      expect(boardStore.startDrag).toHaveBeenCalledWith('player-1', 1, { eventId: 5, groupNumber: 2, slotNumber: 3 });
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
