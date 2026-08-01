import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { CreateRaidEventDialogComponent, CreateRaidEventDialogData } from './create-raid-event-dialog.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidZone } from '../../models/raid-zone.model';

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

describe('CreateRaidEventDialogComponent', () => {
  let boardStore: { createEvent: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const data: CreateRaidEventDialogData = { guildId: 'g1', guildBranchId: 7 };

  const setup = () => {
    boardStore = { createEvent: vi.fn().mockReturnValue(of(undefined)) };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CreateRaidEventDialogComponent],
      providers: [
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(CreateRaidEventDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(CreateRaidEventDialogComponent).componentInstance;
  };

  const fillValid = (component: CreateRaidEventDialogComponent) => {
    component.name.set('SSC/TK/Gruul');
    component.startsAtLocal.set('2026-08-05T21:00');
    component.selectedZoneIds.set(new Set([10]));
  };

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads the raid zones for the guild branch', () => {
      setup();
      expect(zoneStore.load).toHaveBeenCalledWith('g1', 7);
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false with the default empty form', () => {
      const component = setup();
      expect(component.canSubmit()).toBe(false);
    });

    it('is true once name, start date and at least one zone are set', () => {
      const component = setup();
      fillValid(component);
      expect(component.canSubmit()).toBe(true);
    });

    it('is false when the name is blank/whitespace', () => {
      const component = setup();
      fillValid(component);
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when no zone is selected', () => {
      const component = setup();
      fillValid(component);
      component.selectedZoneIds.set(new Set());
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when groupCount is not positive', () => {
      const component = setup();
      fillValid(component);
      component.groupCount.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when slotsPerGroup is not positive', () => {
      const component = setup();
      fillValid(component);
      component.slotsPerGroup.set(0);
      expect(component.canSubmit()).toBe(false);
    });

    it('is false while already submitting', () => {
      const component = setup();
      fillValid(component);
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup();
      component.submit();
      expect(boardStore.createEvent).not.toHaveBeenCalled();
    });

    it('creates the event with a trimmed name and the selected zones', () => {
      const component = setup();
      fillValid(component);
      component.name.set('  SSC/TK/Gruul  ');
      component.groupCount.set(4);
      component.slotsPerGroup.set(4);

      component.submit();

      expect(boardStore.createEvent).toHaveBeenCalledWith('g1', 7, {
        name: 'SSC/TK/Gruul',
        startsAtUtc: new Date('2026-08-05T21:00').toISOString(),
        groupCount: 4,
        slotsPerGroup: 4,
        signupMode: 'DefaultPresent',
        raidZoneIds: [10],
      });
    });

    it('shows a success snackbar and closes the dialog with true on success', () => {
      const component = setup();
      fillValid(component);

      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.createSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped snackbar error on failure, without closing', () => {
      const component = setup();
      fillValid(component);
      boardStore.createEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidZoneNotFound' } })));

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidZoneNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup();
      component.cancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
