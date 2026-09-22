import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { EditRaidEventDialogComponent, EditRaidEventDialogData } from './edit-raid-event-dialog.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildStore } from '../../../stores/guild.store';
import { RaidsService } from '../../services/raids.service';
import { GuildSettingsService } from '../../../settings/services/guild-settings.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { DayAvailabilityStatus } from '../../../../calendar/models/day-availability-status.enum';
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
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [zone()],
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

describe('EditRaidEventDialogComponent', () => {
  let boardStore: { updateEvent: ReturnType<typeof vi.fn>; publishEvent: ReturnType<typeof vi.fn>; deleteEvent: ReturnType<typeof vi.fn> };
  let zoneStore: { zones: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn> };
  let guildStore: { settings: ReturnType<typeof signal>; loadSettings: ReturnType<typeof vi.fn> };
  let raidsService: { createAnnouncementChannel: ReturnType<typeof vi.fn>; getEventChoices: ReturnType<typeof vi.fn> };
  let guildSettingsService: { getNotificationChannels: ReturnType<typeof vi.fn>; getCategories: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let transloco: { getActiveLang: ReturnType<typeof vi.fn>; activeLang: ReturnType<typeof signal>; translate: ReturnType<typeof vi.fn> };

  const setup = (event: RaidEvent, confirmed = true) => {
    boardStore = {
      updateEvent: vi.fn().mockReturnValue(of(undefined)),
      publishEvent: vi.fn().mockReturnValue(of(undefined)),
      deleteEvent: vi.fn().mockReturnValue(of(undefined)),
    };
    zoneStore = { zones: signal([zone()]), load: vi.fn() };
    guildStore = { settings: signal({ language: 'en' }), loadSettings: vi.fn() };
    raidsService = {
      createAnnouncementChannel: vi.fn().mockReturnValue(of({ body: { id: 'c-new', name: 'raid-name', missingPermissions: [], categoryName: null } })),
      getEventChoices: vi.fn().mockReturnValue(of([])),
    };
    guildSettingsService = {
      getNotificationChannels: vi.fn().mockReturnValue(of([])),
      getCategories: vi.fn().mockReturnValue(of({ canCreateRootChannel: true, categories: [] })),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialogRef = { close: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(confirmed) }) };
    transloco = {
      getActiveLang: vi.fn(() => 'en-US'),
      activeLang: signal('en-US'),
      translate: vi.fn((key: string) => key),
    };

    const data: EditRaidEventDialogData = { guildId: 'g1', guildBranchId: 7, event };

    TestBed.configureTestingModule({
      imports: [EditRaidEventDialogComponent],
      providers: [
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidZoneStore, useValue: zoneStore },
        { provide: GuildStore, useValue: guildStore },
        { provide: RaidsService, useValue: raidsService },
        { provide: GuildSettingsService, useValue: guildSettingsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: Dialog, useValue: dialog },
        { provide: TranslocoService, useValue: transloco },
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

  // ── extendCandidates ─────────────────────────────────────────────────────

  describe('extendCandidates', () => {
    it("fetches choices scoped to the event's own start date on construction", () => {
      setup(raidEvent({ startsAtUtc: '2026-08-05T21:00:00Z' }));
      TestBed.tick();

      expect(raidsService.getEventChoices).toHaveBeenCalledWith('g1', 7, new Date('2026-08-05T21:00:00Z').toISOString());
    });

    it('excludes itself and its own descendants from the candidates', () => {
      const component = setup(raidEvent({ id: 1 }));
      raidsService.getEventChoices.mockReturnValue(
        of([
          { id: 1, name: 'Self', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null },
          { id: 2, name: 'Descendant', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: 1 },
          { id: 3, name: 'Unrelated', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null },
        ]),
      );
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();

      expect(component.extendCandidates().map((o) => o.value)).toEqual([3]);
    });

    it("keeps the current target selectable even when it's missing from the fresh fetch", () => {
      const component = setup(raidEvent({ id: 1, extendsRaidEventId: 99, extendsRaidEventName: 'Old Raid' }));
      raidsService.getEventChoices.mockReturnValue(of([{ id: 3, name: 'Unrelated', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null }]));
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();

      expect(component.extendCandidates()).toContainEqual({ value: 99, label: 'Old Raid' });
    });

    it('falls back to a bare id label for the current target when it has no name', () => {
      const component = setup(raidEvent({ id: 1, extendsRaidEventId: 99, extendsRaidEventName: null }));
      raidsService.getEventChoices.mockReturnValue(of([]));
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();

      expect(component.extendCandidates()).toContainEqual({ value: 99, label: '#99' });
    });

    it('clears the candidates if the start date is cleared', () => {
      const component = setup(raidEvent({ id: 1 }));
      raidsService.getEventChoices.mockReturnValue(of([{ id: 3, name: 'Unrelated', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null }]));
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();
      expect(component.extendCandidates().length).toBe(1);

      component.startsAtLocal.set('');
      TestBed.tick();

      expect(component.extendCandidates()).toEqual([]);
    });

    it('does not duplicate the current target when the fresh fetch already includes it', () => {
      const component = setup(raidEvent({ id: 1, extendsRaidEventId: 99, extendsRaidEventName: 'Old Raid' }));
      raidsService.getEventChoices.mockReturnValue(of([{ id: 99, name: 'Old Raid', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null }]));
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();

      expect(component.extendCandidates().filter((o) => o.value === 99)).toHaveLength(1);
    });
  });

  // ── stale extendsRaidEventId reset ───────────────────────────────────────

  describe('extendsRaidEventId reset', () => {
    it('leaves the selection untouched while it still matches a candidate', () => {
      const component = setup(raidEvent({ id: 1 }));
      raidsService.getEventChoices.mockReturnValue(of([{ id: 5, name: 'Split 1', startsAtLocal: '2026-08-05T21:00:00', extendsRaidEventId: null }]));
      component.startsAtLocal.set('2026-08-05T21:00');
      TestBed.tick();

      component.extendsRaidEventId.set(5);
      TestBed.tick();

      expect(component.extendsRaidEventId()).toBe(5);
    });

    it('resets the selection to null once it no longer matches any candidate', () => {
      const component = setup(raidEvent({ id: 1 }));
      component.extendsRaidEventId.set(999);

      TestBed.tick();

      expect(component.extendsRaidEventId()).toBeNull();
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

    describe('with the channel field shown (Signup-mode event)', () => {
      it('is false in "existing" mode with no channel selected', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: null }));
        component.channelMode.set('existing');
        expect(component.canSubmit()).toBe(false);
      });

      it('is true in "existing" mode with a channel already selected', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: 'c1' }));
        component.channelMode.set('existing');
        expect(component.canSubmit()).toBe(true);
      });

      it('is false in "new" mode with no new channel name', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup }));
        component.channelMode.set('new');
        expect(component.canSubmit()).toBe(false);
      });

      it('is false in "new" mode with a name but no create permission there', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup }));
        component.channelMode.set('new');
        component.newChannelName.set('raid-name');
        component.canCreateChannelAtSelection.set(false);
        expect(component.canSubmit()).toBe(false);
      });

      it('is true in "new" mode with a name and create permission', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup }));
        component.channelMode.set('new');
        component.newChannelName.set('raid-name');
        component.canCreateChannelAtSelection.set(true);
        expect(component.canSubmit()).toBe(true);
      });
    });
  });

  // ── showChannelField / constructor loading ──────────────────────────────

  describe('showChannelField', () => {
    it('is true for a Signup-mode event', () => {
      expect(setup(raidEvent({ signupMode: SignupMode.Signup })).showChannelField).toBe(true);
    });

    it('is false for a DefaultPresent event', () => {
      expect(setup(raidEvent({ signupMode: SignupMode.DefaultPresent })).showChannelField).toBe(false);
    });

    it('loads guild settings, notification channels and categories for a Signup-mode event', () => {
      setup(raidEvent({ signupMode: SignupMode.Signup }));

      expect(guildStore.loadSettings).toHaveBeenCalledWith('g1');
      expect(guildSettingsService.getNotificationChannels).toHaveBeenCalledWith('g1');
      expect(guildSettingsService.getCategories).toHaveBeenCalledWith('g1');
    });

    it('does not load any of that for a DefaultPresent event', () => {
      setup(raidEvent({ signupMode: SignupMode.DefaultPresent }));

      expect(guildStore.loadSettings).not.toHaveBeenCalled();
      expect(guildSettingsService.getNotificationChannels).not.toHaveBeenCalled();
      expect(guildSettingsService.getCategories).not.toHaveBeenCalled();
    });

    it('preselects the event\'s current channel id', () => {
      expect(setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: 'c1' })).selectedChannelId()).toBe('c1');
    });
  });

  // ── guildLanguage ────────────────────────────────────────────────────────

  describe('guildLanguage', () => {
    it('reads the language from the guild settings', () => {
      const component = setup(raidEvent());
      expect(component.guildLanguage()).toBe('en');
    });

    it('falls back to English when the guild settings have not loaded yet', () => {
      const component = setup(raidEvent());
      guildStore.settings.set(null);
      expect(component.guildLanguage()).toBe('en');
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

    describe('channel field (Signup-mode event)', () => {
      it('sends dedicatedAnnouncementChannelId null when the event is not Signup-mode', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.DefaultPresent }));

        component.submit();

        expect(boardStore.updateEvent).toHaveBeenCalledWith('g1', 7, 1, expect.objectContaining({ dedicatedAnnouncementChannelId: null, dedicatedAnnouncementChannelIsBotOwned: false }));
      });

      it('creates a new channel first, then submits with the returned channel id and botOwned true', async () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: null }));
        component.channelMode.set('new');
        component.newChannelName.set('raid-name');
        component.selectedCategoryId.set('cat1');

        await component.submit();

        expect(raidsService.createAnnouncementChannel).toHaveBeenCalledWith('g1', 7, 'raid-name', 'cat1');
        expect(component.selectedChannelId()).toBe('c-new');
        expect(boardStore.updateEvent).toHaveBeenCalledWith(
          'g1', 7, 1,
          expect.objectContaining({ dedicatedAnnouncementChannelId: 'c-new', dedicatedAnnouncementChannelIsBotOwned: true }),
        );
      });

      it('shows an error and never calls updateEvent when channel creation fails', async () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup }));
        component.channelMode.set('new');
        component.newChannelName.set('raid-name');
        raidsService.createAnnouncementChannel.mockReturnValue(throwError(() => new Error('403')));

        await component.submit();

        expect(component.submitting()).toBe(false);
        expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.eventDialog.createChannelFailed');
        expect(boardStore.updateEvent).not.toHaveBeenCalled();
      });

      it('reuses an existing channel selection without creating a new one', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: 'c1' }));
        component.channelMode.set('existing');
        component.selectedChannelId.set('c2');

        component.submit();

        expect(raidsService.createAnnouncementChannel).not.toHaveBeenCalled();
        expect(boardStore.updateEvent).toHaveBeenCalledWith('g1', 7, 1, expect.objectContaining({ dedicatedAnnouncementChannelId: 'c2' }));
      });

      it('preserves dedicatedAnnouncementChannelIsBotOwned true when re-saving the same bot-owned channel', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: 'c1', dedicatedAnnouncementChannelIsBotOwned: true }));
        component.channelMode.set('existing');
        component.selectedChannelId.set('c1');

        component.submit();

        expect(boardStore.updateEvent).toHaveBeenCalledWith('g1', 7, 1, expect.objectContaining({ dedicatedAnnouncementChannelIsBotOwned: true }));
      });

      it('flips dedicatedAnnouncementChannelIsBotOwned to false when switching to a different existing channel', () => {
        const component = setup(raidEvent({ signupMode: SignupMode.Signup, dedicatedAnnouncementChannelId: 'c1', dedicatedAnnouncementChannelIsBotOwned: true }));
        component.channelMode.set('existing');
        component.selectedChannelId.set('c2');

        component.submit();

        expect(boardStore.updateEvent).toHaveBeenCalledWith('g1', 7, 1, expect.objectContaining({ dedicatedAnnouncementChannelIsBotOwned: false }));
      });
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
