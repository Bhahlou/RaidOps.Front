import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { RaidDetailComponent } from './raid-detail.component';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { RaidsService } from '../../services/raids.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { GuildRosterStore } from '../../../roster/stores/guild-roster.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildAccessLevel } from '../../../../../core/models/guild-access-level.enum';
import { User } from '../../../../../core/models/user.model';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';
import { SignupStatus } from '../../models/signup-status.enum';
import { GuildRosterMember } from '../../../models/guild-roster-member.model';
import { CharacterRank } from '../../../models/character-rank.enum';
import { SignupCharacterDialogComponent } from '../../components/signup-character-dialog/signup-character-dialog.component';
import { EditRaidEventDialogComponent } from '../../components/edit-raid-event-dialog/edit-raid-event-dialog.component';
import { RaidGroupingCharacterDialogComponent } from '../../components/raid-grouping-character-dialog/raid-grouping-character-dialog.component';

const raidEvent = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 11,
  raidSeriesId: null,
  name: 'Split 1',
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

describe('RaidDetailComponent', () => {
  let boardStore: {
    events: ReturnType<typeof signal>;
    isLoading: ReturnType<typeof signal>;
    loadEvent: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    setMySignup: ReturnType<typeof vi.fn>;
    publishEvent: ReturnType<typeof vi.fn>;
  };
  let raidsService: { announceGrouping: ReturnType<typeof vi.fn> };
  let rosterStore: { members: ReturnType<typeof signal>; loadRoster: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let transloco: { getActiveLang: ReturnType<typeof vi.fn>; activeLang: ReturnType<typeof signal>; translate: ReturnType<typeof vi.fn> };

  const setup = (opts?: {
    user?: User | null;
    events?: RaidEvent[];
    isLoading?: boolean;
    guildId?: string | null;
    branchId?: number;
    eventId?: number;
    members?: GuildRosterMember[];
  }) => {
    boardStore = {
      events: signal(opts?.events ?? [raidEvent()]),
      isLoading: signal(opts?.isLoading ?? false),
      loadEvent: vi.fn(),
      reload: vi.fn(),
      setMySignup: vi.fn().mockReturnValue(of(undefined)),
      publishEvent: vi.fn().mockReturnValue(of(undefined)),
    };
    raidsService = { announceGrouping: vi.fn().mockReturnValue(of(undefined)) };
    rosterStore = { members: signal(opts?.members ?? []), loadRoster: vi.fn() };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    transloco = {
      getActiveLang: vi.fn(() => 'en-US'),
      activeLang: signal('en-US'),
      translate: vi.fn((key: string) => key),
    };

    const guildId = opts?.guildId === undefined ? 'g1' : opts.guildId;
    const branchId = opts?.branchId ?? 7;
    const eventId = opts?.eventId ?? 11;

    TestBed.configureTestingModule({
      imports: [RaidDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'branchId' ? String(branchId) : key === 'eventId' ? String(eventId) : guildId),
              },
            },
            paramMap: of(convertToParamMap({ id: guildId ?? '', branchId: String(branchId), eventId: String(eventId) })),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(opts?.user === undefined ? fakeUser() : opts.user) } },
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidsService, useValue: raidsService },
        { provide: GuildRosterStore, useValue: rosterStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(RaidDetailComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidDetailComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('reads eventId from the route', () => {
    expect(setup({ eventId: 42 }).eventId).toBe(42);
  });

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads the event and the roster', () => {
      setup({ guildId: 'g1', branchId: 7, eventId: 11 });

      expect(boardStore.loadEvent).toHaveBeenCalledWith('g1', 7, 11);
      expect(rosterStore.loadRoster).toHaveBeenCalledWith('g1', 7);
    });
  });

  // ── event / isLoading ────────────────────────────────────────────────────

  describe('event', () => {
    it('finds the event matching eventId among the board store events', () => {
      const event = raidEvent({ id: 11, name: 'Split 1' });
      const component = setup({ events: [raidEvent({ id: 1 }), event], eventId: 11 });

      expect(component.event()).toBe(event);
    });

    it('is undefined when no event matches', () => {
      const component = setup({ events: [], eventId: 11 });
      expect(component.event()).toBeUndefined();
    });
  });

  describe('isLoading', () => {
    it('delegates to the board store', () => {
      expect(setup({ isLoading: true }).isLoading()).toBe(true);
    });
  });

  // ── breadcrumbs ──────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the raid name as the leaf label once loaded', () => {
      const component = setup({ events: [raidEvent({ id: 11, name: 'Split 1' })] });
      expect(component.breadcrumbs().at(-1)).toEqual({ label: 'Split 1' });
    });

    it('falls back to the generic breadcrumb key while the event is not yet loaded', () => {
      const component = setup({ events: [] });
      expect(component.breadcrumbs().at(-1)).toEqual({ i18nKey: 'raidBuilder.detail.breadcrumb' });
    });

    it('links the raid-builder crumb to the branch\'s raids page', () => {
      const component = setup({ guildId: 'g1', branchId: 7 });
      expect(component.breadcrumbs()[1]).toEqual({ i18nKey: 'sidenav.guild.raidBuilder', link: ['/guilds', 'g1', '7', 'raids'] });
    });
  });

  // ── isOfficer ────────────────────────────────────────────────────────────

  describe('isOfficer', () => {
    it('is false with no authenticated user', () => {
      expect(setup({ user: null }).isOfficer()).toBe(false);
    });

    it('is false for a Roster-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Roster) }).isOfficer()).toBe(false);
    });

    it('is true for an Officer-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Officer) }).isOfficer()).toBe(true);
    });
  });

  // ── currentUserDiscordId / rosterMembers / myCharacters ─────────────────

  describe('currentUserDiscordId', () => {
    it('reads the discordId from the authenticated user', () => {
      expect(setup({ user: fakeUser() }).currentUserDiscordId()).toBe('player-1');
    });

    it('is null with no authenticated user', () => {
      expect(setup({ user: null }).currentUserDiscordId()).toBeNull();
    });
  });

  describe('rosterMembers', () => {
    it('falls back to an empty array when the store has no members loaded yet', () => {
      const component = setup();
      rosterStore.members.set(null);
      expect(component.rosterMembers()).toEqual([]);
    });
  });

  describe('myCharacters', () => {
    it('filters the roster down to the current user\'s own characters', () => {
      const component = setup({ members: [member({ playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-2' })] });
      expect(component.myCharacters().map((c) => c.characterId)).toEqual([1]);
    });

    it('is empty with no authenticated user', () => {
      const component = setup({ user: null, members: [member()] });
      expect(component.myCharacters()).toEqual([]);
    });
  });

  // ── roleCounts / zoneIcon / fullDateTime ─────────────────────────────────

  describe('roleCounts', () => {
    it('delegates to countRaidRoles for the event assignments', () => {
      const component = setup();
      expect(component.roleCounts(raidEvent())).toEqual({ tank: 0, heal: 0, melee: 0, ranged: 0 });
    });
  });

  describe('zoneIcon', () => {
    it('resolves a known short code', () => {
      expect(setup().zoneIcon('SSC')).toBe('/assets/images/raid-icons/ssc.jpg');
    });

    it('is null for an unknown short code', () => {
      expect(setup().zoneIcon('NOPE')).toBeNull();
    });
  });

  describe('fullDateTime', () => {
    it('formats a non-empty label using the active language', () => {
      const component = setup();
      const label = component.fullDateTime(raidEvent());

      expect(transloco.getActiveLang).toHaveBeenCalled();
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // ── setSignup ─────────────────────────────────────────────────────────────

  describe('setSignup', () => {
    it('does nothing when the event has not loaded yet', () => {
      const component = setup({ events: [] });
      component.setSignup(SignupStatus.Declined);
      expect(boardStore.setMySignup).not.toHaveBeenCalled();
    });

    it('submits a Declined response directly, with no character/spec', () => {
      const component = setup({ members: [member()] });

      component.setSignup(SignupStatus.Declined);

      expect(boardStore.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Declined, null, null);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('auto-submits Accepted when the viewer has exactly one character with at most one spec', () => {
      const component = setup({ members: [member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }] })] });

      component.setSignup(SignupStatus.Accepted);

      expect(boardStore.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Accepted, 1, 71);
    });

    it('auto-submits with a null spec when the single character has no raid specs at all', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });

      component.setSignup(SignupStatus.Tentative);

      expect(boardStore.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Tentative, 1, null);
    });

    it('opens the character picker when the viewer has more than one character', () => {
      const component = setup({
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(dialog.open).toHaveBeenCalledWith(
        SignupCharacterDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ currentCharacterId: null, currentSpecId: null }) }),
      );
      expect(boardStore.setMySignup).not.toHaveBeenCalled();
    });

    it('opens the character picker when the single character has more than one raid spec', () => {
      const component = setup({
        members: [member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }, { specId: 72, name: 'Fury', iconUrl: null, isMain: false }] })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(dialog.open).toHaveBeenCalled();
      expect(boardStore.setMySignup).not.toHaveBeenCalled();
    });

    it('submits the picker result on close', () => {
      const component = setup({
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of({ characterId: 5, specId: 99 }) });

      component.setSignup(SignupStatus.Accepted);

      expect(boardStore.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Accepted, 5, 99);
    });

    it('does nothing when the picker is dismissed (null result)', () => {
      const component = setup({
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(boardStore.setMySignup).not.toHaveBeenCalled();
    });
  });

  // ── #submitSignup (via setSignup) ────────────────────────────────────────

  describe('#submitSignup', () => {
    it('reloads the board on success', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });

      component.setSignup(SignupStatus.Declined);

      expect(boardStore.reload).toHaveBeenCalledOnce();
    });

    it('shows an error snackbar on failure', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });
      boardStore.setMySignup.mockReturnValue(throwError(() => new Error('boom')));

      component.setSignup(SignupStatus.Declined);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.signup.saveFailed');
      expect(boardStore.reload).not.toHaveBeenCalled();
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

  // ── publishEvent ─────────────────────────────────────────────────────────

  describe('publishEvent', () => {
    it('does nothing when the confirm dialog is dismissed', () => {
      const component = setup();

      component.publishEvent(raidEvent());

      expect(boardStore.publishEvent).not.toHaveBeenCalled();
    });

    it('publishes and reloads on confirm', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.publishEvent(raidEvent());

      expect(boardStore.publishEvent).toHaveBeenCalledWith('g1', 7, 11);
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.eventDialog.publishSuccess');
      expect(boardStore.reload).toHaveBeenCalled();
      expect(component.publishing()).toBe(false);
    });

    it('shows a translated error snackbar and resets publishing on failure', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      boardStore.publishEvent.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventAlreadyPublished' } })));

      component.publishEvent(raidEvent());

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.errors.raidEventAlreadyPublished');
      expect(component.publishing()).toBe(false);
    });
  });

  // ── triggerGrouping ───────────────────────────────────────────────────────

  describe('triggerGrouping', () => {
    it('announces grouping and shows a success snackbar', async () => {
      const component = setup();

      await component.triggerGrouping();

      expect(raidsService.announceGrouping).toHaveBeenCalledWith('g1', 7, 11);
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.detail.groupingSent');
      expect(component.triggeringGrouping()).toBe(false);
    });

    it('opens the character-picker dialog when the requester has no character in the raid', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(dialog.open).toHaveBeenCalledWith(RaidGroupingCharacterDialogComponent, {
        width: '420px',
        data: { guildId: 'g1', guildBranchId: 7, eventId: 11 },
      });
      expect(snackbar.error).not.toHaveBeenCalled();
    });

    it('shows a success snackbar when the character-picker dialog closes with a sent result', async () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.detail.groupingSent');
    });

    it('does not show a success snackbar when the character-picker dialog is cancelled', async () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.success).not.toHaveBeenCalled();
    });

    it('shows a generic error snackbar for any other failure', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventNotPublished' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.detail.groupingFailed');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('resets triggeringGrouping in the finally block on failure', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(throwError(() => new HttpErrorResponse({ error: null })));

      await component.triggerGrouping();

      expect(component.triggeringGrouping()).toBe(false);
    });
  });
});
