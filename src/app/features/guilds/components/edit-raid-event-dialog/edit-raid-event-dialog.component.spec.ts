import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { EditRaidEventDialogComponent, EditRaidEventDialogData } from './edit-raid-event-dialog.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { RaidZone } from '../../models/raid-zone.model';
import { SignupMode } from '../../models/signup-mode.enum';

const zone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 10,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 1,
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
  availableSpecs: [],
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
  raidZones: [zone()],
  assignments: [],
  absentPlayerDiscordIds: [],
  ...overrides,
});

describe('EditRaidEventDialogComponent', () => {
  let boardStore: { updateEvent: ReturnType<typeof vi.fn>; publishEvent: ReturnType<typeof vi.fn>; deleteEvent: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  const setup = (event: RaidEvent, confirmed = true) => {
    boardStore = {
      updateEvent: vi.fn().mockReturnValue(of(undefined)),
      publishEvent: vi.fn().mockReturnValue(of(undefined)),
      deleteEvent: vi.fn().mockReturnValue(of(undefined)),
    };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(confirmed) }) };

    const data: EditRaidEventDialogData = { guildId: 'g1', guildBranchId: 7, event };

    TestBed.configureTestingModule({
      imports: [EditRaidEventDialogComponent],
      providers: [
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: Dialog, useValue: dialog },
      ],
    }).overrideComponent(EditRaidEventDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(EditRaidEventDialogComponent).componentInstance;
  };

  // ── constructor / initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('loads the raid zones for the guild branch', () => {
      setup(raidEvent());
      expect(zoneStore.load).toHaveBeenCalledWith('g1', 7);
    });

    it('pre-fills the form from the event', () => {
      const component = setup(raidEvent({ name: 'SSC/TK/Gruul', groupCount: 4, slotsPerGroup: 4, raidZones: [zone({ id: 10 })] }));

      expect(component.name()).toBe('SSC/TK/Gruul');
      expect(component.groupCount()).toBe(4);
      expect(component.slotsPerGroup()).toBe(4);
      expect(component.selectedZoneIds()).toEqual(new Set([10]));
      expect(component.startsAtLocal()).toContain('2026-08-05');
    });

    it('is read-only once the event is no longer Scheduled', () => {
      const component = setup(raidEvent({ status: RaidEventStatus.Completed }));
      expect(component.isReadOnly).toBe(true);
    });

    it('is not read-only while Scheduled', () => {
      const component = setup(raidEvent({ status: RaidEventStatus.Scheduled }));
      expect(component.isReadOnly).toBe(false);
    });

    it('flags hasAssignments when the event has at least one', () => {
      const component = setup(raidEvent({ assignments: [assignment()] }));
      expect(component.hasAssignments).toBe(true);
    });

    it('flags isDraft true for a Draft event', () => {
      expect(setup(raidEvent({ publicationStatus: RaidPublicationStatus.Draft })).isDraft).toBe(true);
    });

    it('flags isDraft false for a Published event', () => {
      expect(setup(raidEvent({ publicationStatus: RaidPublicationStatus.Published })).isDraft).toBe(false);
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is true for a valid Scheduled event as pre-filled', () => {
      expect(setup(raidEvent()).canSubmit()).toBe(true);
    });

    it('is false when the event is read-only', () => {
      expect(setup(raidEvent({ status: RaidEventStatus.Completed })).canSubmit()).toBe(false);
    });

    it('is false while submitting', () => {
      const component = setup(raidEvent());
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when the name is blank', () => {
      const component = setup(raidEvent());
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when the start date is cleared', () => {
      const component = setup(raidEvent());
      component.startsAtLocal.set('');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when no zone is selected', () => {
      const component = setup(raidEvent());
      component.selectedZoneIds.set(new Set());
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when groupCount is not positive', () => {
      const component = setup(raidEvent());
      component.groupCount.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when slotsPerGroup is not positive', () => {
      const component = setup(raidEvent());
      component.slotsPerGroup.set(0);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup(raidEvent({ status: RaidEventStatus.Completed }));
      component.submit();
      expect(boardStore.updateEvent).not.toHaveBeenCalled();
    });

    it('updates the event, preserving its signupMode', () => {
      const component = setup(raidEvent({ id: 4, signupMode: SignupMode.DefaultPresent }));
      component.name.set('  Updated  ');

      component.submit();

      expect(boardStore.updateEvent).toHaveBeenCalledWith('g1', 7, 4, expect.objectContaining({ name: 'Updated', signupMode: SignupMode.DefaultPresent }));
    });

    it('shows a success snackbar and closes with true on success', () => {
      const component = setup(raidEvent());
      component.submit();
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped error on failure', () => {
      const component = setup(raidEvent());
      boardStore.updateEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'BranchMismatch' } })));

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.branchMismatch');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── publish ──────────────────────────────────────────────────────────────

  describe('publish', () => {
    it('does nothing when the confirm dialog is dismissed', () => {
      const component = setup(raidEvent(), false);
      component.publish();
      expect(boardStore.publishEvent).not.toHaveBeenCalled();
    });

    it('publishes and closes with true on confirm + success', () => {
      const component = setup(raidEvent({ id: 4 }), true);
      component.publish();

      expect(dialog.open).toHaveBeenCalled();
      expect(boardStore.publishEvent).toHaveBeenCalledWith('g1', 7, 4);
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.publishSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('shows a mapped snackbar error on failure', () => {
      const component = setup(raidEvent(), true);
      boardStore.publishEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventAlreadyPublished' } })));

      component.publish();

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidEventAlreadyPublished');
    });
  });

  // ── deleteEvent ──────────────────────────────────────────────────────────

  describe('deleteEvent', () => {
    it('does nothing when the confirm dialog is dismissed', () => {
      const component = setup(raidEvent(), false);
      component.deleteEvent();
      expect(boardStore.deleteEvent).not.toHaveBeenCalled();
    });

    it('uses the plain delete message when the event has no assignments', () => {
      const component = setup(raidEvent({ assignments: [] }), true);
      component.deleteEvent();

      expect(dialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ message: 'raidBuilder.eventDialog.deleteConfirmMessage' }) }),
      );
    });

    it('uses the stronger warning message when the event has assignments', () => {
      const component = setup(raidEvent({ assignments: [assignment()] }), true);
      component.deleteEvent();

      expect(dialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ message: 'raidBuilder.eventDialog.deleteConfirmMessageWithAssignments' }) }),
      );
    });

    it('deletes and closes with true on confirm + success', () => {
      const component = setup(raidEvent({ id: 4 }), true);
      component.deleteEvent();

      expect(boardStore.deleteEvent).toHaveBeenCalledWith('g1', 7, 4);
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.deleteSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('shows a mapped snackbar error on failure', () => {
      const component = setup(raidEvent(), true);
      boardStore.deleteEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventNotFound' } })));

      component.deleteEvent();

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidEventNotFound');
    });
  });

  // ── close ────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('closes the dialog with false', () => {
      const component = setup(raidEvent());
      component.close();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
