import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { RaidsComponent } from './raids.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';
import { User } from '../../../../core/models/user.model';
import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { RaidSeries } from '../../models/raid-series.model';
import { RaidSlotAssignment } from '../../models/raid-slot-assignment.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { CreateRaidSeriesDialogComponent } from '../../components/create-raid-series-dialog/create-raid-series-dialog.component';
import { DeactivateRaidSeriesDialogComponent } from '../../components/deactivate-raid-series-dialog/deactivate-raid-series-dialog.component';
import { CreateRaidEventDialogComponent } from '../../components/create-raid-event-dialog/create-raid-event-dialog.component';
import { EditRaidEventDialogComponent } from '../../components/edit-raid-event-dialog/edit-raid-event-dialog.component';

const assignment = (overrides?: Partial<RaidSlotAssignment>): RaidSlotAssignment => ({
  groupNumber: 1,
  slotNumber: 1,
  characterId: 1,
  characterName: 'Addse',
  classId: 73,
  classColor: '#c79c6e',
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  availabilityStatus: DayAvailabilityStatus.Available,
  spec: { id: 73, name: 'Protection', iconUrl: null },
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
  raidZones: [],
  assignments: [],
  absentPlayerDiscordIds: [],
  ...overrides,
});

const raidSeries = (overrides?: Partial<RaidSeries>): RaidSeries => ({
  id: 1,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  recurrenceDayOfWeek: 'Tuesday',
  recurrenceStartTimeLocal: '21:00:00',
  recurrenceIntervalWeeks: 1,
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  isActive: true,
  raidZones: [],
  ...overrides,
});

const userGuild = (accessLevel: GuildAccessLevel) => ({
  id: 'g1',
  name: 'Dah Boo',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  accessLevel,
  branches: [{ id: 7, branchId: 3, branchName: 'Classic Anniversary', accessLevel, hasActiveCharacter: true }],
});

const fakeUser = (accessLevel: GuildAccessLevel = GuildAccessLevel.Officer): User => ({
  discordId: 'player-1',
  name: 'Dah Boo',
  avatarHash: null,
  guilds: [userGuild(accessLevel)],
  notifications: [],
  seenChangelogEntryIds: [],
});

describe('RaidsComponent', () => {
  let boardStore: {
    events: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    loadRange: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    getLockoutWeek: ReturnType<typeof vi.fn>;
  };
  let seriesStore: { series: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let rosterStore: { members: ReturnType<typeof signal>; loadRoster: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let transloco: { getActiveLang: ReturnType<typeof vi.fn>; activeLang: ReturnType<typeof signal>; translate: ReturnType<typeof vi.fn> };

  const setup = (opts?: { user?: User | null; events?: RaidEvent[]; series?: RaidSeries[]; guildId?: string | null; branchId?: number; lockoutWeekStart?: string | null }) => {
    boardStore = {
      events: signal(opts?.events ?? []),
      isLoading: signal(false),
      loadRange: vi.fn(),
      reload: vi.fn(),
      getLockoutWeek: vi.fn().mockReturnValue(of({ weekStartLocal: opts?.lockoutWeekStart ?? null, weekEndLocal: null })),
    };
    seriesStore = { series: signal(opts?.series ?? []), load: vi.fn(), reload: vi.fn() };
    rosterStore = { members: signal([]), loadRoster: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    transloco = {
      getActiveLang: vi.fn(() => 'en-US'),
      activeLang: signal('en-US'),
      translate: vi.fn((key: string) => key),
    };

    const guildId = opts?.guildId === undefined ? 'g1' : opts.guildId;
    const branchId = opts?.branchId ?? 7;

    TestBed.configureTestingModule({
      imports: [RaidsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'branchId' ? String(branchId) : guildId) } },
            paramMap: of(convertToParamMap(guildId ? { id: guildId, branchId: String(branchId) } : {})),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(opts?.user === undefined ? fakeUser() : opts.user) } },
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidSeriesStore, useValue: seriesStore },
        { provide: GuildRosterStore, useValue: rosterStore },
        { provide: Dialog, useValue: dialog },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(RaidsComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(RaidsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── breadcrumbs ──────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('sets i18nKey to sidenav.guild.raidBuilder on the last breadcrumb', () => {
      expect(setup().breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.raidBuilder');
    });
  });

  // ── isOfficer ────────────────────────────────────────────────────────────

  describe('isOfficer', () => {
    it('is false with no authenticated user', () => {
      expect(setup({ user: null }).isOfficer()).toBe(false);
    });

    it('is false when the user has no matching guild', () => {
      const user = fakeUser();
      user.guilds = [{ ...userGuild(GuildAccessLevel.Officer), id: 'other-guild' }];
      expect(setup({ user }).isOfficer()).toBe(false);
    });

    it('is false for a Roster-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Roster) }).isOfficer()).toBe(false);
    });

    it('is true for an Officer-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Officer) }).isOfficer()).toBe(true);
    });
  });

  // ── currentUserDiscordId ─────────────────────────────────────────────────

  describe('currentUserDiscordId', () => {
    it('reads the discordId from the authenticated user', () => {
      expect(setup({ user: fakeUser() }).currentUserDiscordId()).toBe('player-1');
    });

    it('is null with no authenticated user', () => {
      expect(setup({ user: null }).currentUserDiscordId()).toBeNull();
    });
  });

  // ── rangeEnd / rangeLabel ────────────────────────────────────────────────

  describe('rangeEnd / rangeLabel', () => {
    it('rangeEnd is 6 days after rangeStart', () => {
      const component = setup();
      component.rangeStart.set(new Date(2026, 7, 5));

      expect(component.rangeEnd()).toEqual(new Date(2026, 7, 11));
    });

    it('formats the range label from rangeStart to rangeEnd', () => {
      const component = setup();
      component.rangeStart.set(new Date(2026, 7, 5));

      expect(component.rangeLabel()).toBe('Aug 5 – Aug 11');
    });
  });

  // ── events / isLoading / activeSeries / rosterMembers ───────────────────

  describe('events / isLoading', () => {
    it('delegates to the board store', () => {
      const events = [raidEvent()];
      const component = setup({ events });
      expect(component.events()).toBe(events);
    });
  });

  describe('activeSeries', () => {
    it('only includes active series', () => {
      const active = raidSeries({ id: 1, isActive: true });
      const inactive = raidSeries({ id: 2, isActive: false });
      expect(setup({ series: [active, inactive] }).activeSeries()).toEqual([active]);
    });

    it('is empty when the store has no series loaded yet', () => {
      const component = setup();
      seriesStore.series.set(null);
      expect(component.activeSeries()).toEqual([]);
    });
  });

  describe('rosterMembers', () => {
    it('falls back to an empty array when the store has no members loaded yet', () => {
      const component = setup();
      rosterStore.members.set(null);
      expect(component.rosterMembers()).toEqual([]);
    });

    it('delegates to the store once members are loaded', () => {
      const component = setup();
      rosterStore.members.set([{ characterId: 1 }]);
      expect(component.rosterMembers()).toEqual([{ characterId: 1 }]);
    });
  });

  // ── visibleEvents / activeEventId / selectEvent / isActiveEvent ─────────

  describe('visibleEvents', () => {
    it('sorts events earliest first', () => {
      const late = raidEvent({ id: 1, startsAtUtc: '2026-08-09T19:00:00Z' });
      const early = raidEvent({ id: 2, startsAtUtc: '2026-08-05T19:00:00Z' });
      expect(setup({ events: [late, early] }).visibleEvents().map((e) => e.id)).toEqual([2, 1]);
    });

    it('caps at 4 events', () => {
      const events = Array.from({ length: 5 }, (_, i) => raidEvent({ id: i + 1, startsAtUtc: `2026-08-0${i + 1}T19:00:00Z` }));
      expect(setup({ events }).visibleEvents()).toHaveLength(4);
    });
  });

  describe('activeEventId / selectEvent / isActiveEvent', () => {
    it('defaults to the earliest visible event', () => {
      const late = raidEvent({ id: 1, startsAtUtc: '2026-08-09T19:00:00Z' });
      const early = raidEvent({ id: 2, startsAtUtc: '2026-08-05T19:00:00Z' });
      const component = setup({ events: [late, early] });

      expect(component.activeEventId()).toBe(2);
      expect(component.isActiveEvent(2)).toBe(true);
      expect(component.isActiveEvent(1)).toBe(false);
    });

    it('is null when there are no visible events', () => {
      expect(setup({ events: [] }).activeEventId()).toBeNull();
    });

    it('selectEvent moves the active panel to the chosen event', () => {
      const e1 = raidEvent({ id: 1, startsAtUtc: '2026-08-05T19:00:00Z' });
      const e2 = raidEvent({ id: 2, startsAtUtc: '2026-08-06T19:00:00Z' });
      const component = setup({ events: [e1, e2] });

      component.selectEvent(2);

      expect(component.activeEventId()).toBe(2);
      expect(component.isActiveEvent(2)).toBe(true);
    });
  });

  // ── range navigation ─────────────────────────────────────────────────────

  describe('prevRange / nextRange / goToday', () => {
    it('prevRange moves rangeStart back 7 days', () => {
      const component = setup();
      component.rangeStart.set(new Date(2026, 7, 12));

      component.prevRange();

      expect(component.rangeStart()).toEqual(new Date(2026, 7, 5));
    });

    it('nextRange moves rangeStart forward 7 days', () => {
      const component = setup();
      component.rangeStart.set(new Date(2026, 7, 5));

      component.nextRange();

      expect(component.rangeStart()).toEqual(new Date(2026, 7, 12));
    });

    it('goToday resets rangeStart to the current week (Monday)', () => {
      const component = setup();
      component.rangeStart.set(new Date(2020, 0, 1));

      component.goToday();

      const dayOfWeek = (new Date().getDay() + 6) % 7;
      const expected = new Date();
      expected.setDate(expected.getDate() - dayOfWeek);
      expected.setHours(0, 0, 0, 0);

      expect(component.rangeStart()).toEqual(expected);
    });

    it('re-loads the board/series/roster for the new range', () => {
      const component = setup();
      boardStore.loadRange.mockClear();

      component.nextRange();
      TestBed.tick();

      expect(boardStore.loadRange).toHaveBeenCalled();
      expect(seriesStore.load).toHaveBeenCalled();
      expect(rosterStore.loadRoster).toHaveBeenCalled();
    });
  });

  // ── lockout week default ─────────────────────────────────────────────────

  describe('lockout week default', () => {
    it('adopts the branch lockout week start when configured', () => {
      const component = setup({ lockoutWeekStart: '2026-02-10' });
      expect(component.rangeStart()).toEqual(new Date(2026, 1, 10));
    });

    it('keeps the Monday default when the branch has no region configured', () => {
      const component = setup({ lockoutWeekStart: null });
      const dayOfWeek = (new Date().getDay() + 6) % 7;
      const expected = new Date();
      expected.setDate(expected.getDate() - dayOfWeek);
      expected.setHours(0, 0, 0, 0);

      expect(component.rangeStart()).toEqual(expected);
    });
  });

  // ── zoneIcon / roleCounts ────────────────────────────────────────────────

  describe('zoneIcon', () => {
    it('resolves a known short code', () => {
      expect(setup().zoneIcon('SSC')).toBe('/assets/images/raid-icons/ssc.jpg');
    });
  });

  describe('roleCounts', () => {
    it('tallies raid roles from the event assignments', () => {
      const event = raidEvent({ assignments: [assignment({ spec: { id: 73, name: 'Protection', iconUrl: null } })] });
      expect(setup().roleCounts(event)).toEqual({ tank: 1, heal: 0, melee: 0, ranged: 0 });
    });
  });

  // ── eventLabel ───────────────────────────────────────────────────────────

  describe('eventLabel', () => {
    it('formats a non-empty label using the active language', () => {
      const component = setup();
      const label = component.eventLabel(raidEvent());

      expect(transloco.getActiveLang).toHaveBeenCalled();
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // ── openCreateSeriesDialog ───────────────────────────────────────────────

  describe('openCreateSeriesDialog', () => {
    it('opens the dialog with the guild/branch and given series', () => {
      const component = setup();
      const existing = raidSeries();

      component.openCreateSeriesDialog(existing);

      expect(dialog.open).toHaveBeenCalledWith(
        CreateRaidSeriesDialogComponent,
        expect.objectContaining({ data: { guildId: 'g1', guildBranchId: 7, series: existing } }),
      );
    });

    it('does nothing further when the dialog is dismissed', () => {
      const component = setup();
      component.openCreateSeriesDialog(null);

      expect(seriesStore.reload).not.toHaveBeenCalled();
    });

    it('reloads series and re-runs loadRange for the current week when saved', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      boardStore.loadRange.mockClear();

      component.openCreateSeriesDialog(null);

      expect(seriesStore.reload).toHaveBeenCalled();
      expect(boardStore.loadRange).toHaveBeenCalled();
    });
  });

  // ── openDeactivateSeriesDialog ───────────────────────────────────────────

  describe('openDeactivateSeriesDialog', () => {
    it('does nothing when the confirm dialog is dismissed', () => {
      const component = setup();
      component.openDeactivateSeriesDialog(raidSeries());

      expect(seriesStore.reload).not.toHaveBeenCalled();
      expect(boardStore.reload).not.toHaveBeenCalled();
    });

    it('reloads series and the board when confirmed', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openDeactivateSeriesDialog(raidSeries());

      expect(seriesStore.reload).toHaveBeenCalled();
      expect(boardStore.reload).toHaveBeenCalled();
    });
  });

  // ── openCreateEventDialog ────────────────────────────────────────────────

  describe('openCreateEventDialog', () => {
    it('opens the dialog with the current guild/branch', () => {
      const component = setup();
      component.openCreateEventDialog();

      expect(dialog.open).toHaveBeenCalledWith(CreateRaidEventDialogComponent, expect.objectContaining({ data: { guildId: 'g1', guildBranchId: 7 } }));
    });

    it('does nothing when dismissed', () => {
      const component = setup();
      component.openCreateEventDialog();
      expect(boardStore.reload).not.toHaveBeenCalled();
    });

    it('reloads the board when saved', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openCreateEventDialog();

      expect(boardStore.reload).toHaveBeenCalled();
    });
  });

  // ── openEditEventDialog ──────────────────────────────────────────────────

  describe('openEditEventDialog', () => {
    it('opens the dialog with the guild/branch and given event', () => {
      const component = setup();
      const event = raidEvent();

      component.openEditEventDialog(event);

      expect(dialog.open).toHaveBeenCalledWith(EditRaidEventDialogComponent, expect.objectContaining({ data: { guildId: 'g1', guildBranchId: 7, event } }));
    });

    it('reloads the board when saved', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openEditEventDialog(raidEvent());

      expect(boardStore.reload).toHaveBeenCalled();
    });

    it('does nothing when dismissed', () => {
      const component = setup();
      component.openEditEventDialog(raidEvent());
      expect(boardStore.reload).not.toHaveBeenCalled();
    });
  });
});
