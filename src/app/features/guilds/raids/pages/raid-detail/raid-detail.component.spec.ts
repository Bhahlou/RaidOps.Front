import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { RaidDetailComponent } from './raid-detail.component';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { RaidsService } from '../../services/raids.service';
import { GuildRosterStore } from '../../../roster/stores/guild-roster.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildAccessLevel } from '../../../../../core/models/guild-access-level.enum';
import { User } from '../../../../../core/models/user.model';
import { RaidEventSummary } from '../../models/raid-event.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { SignupStatus } from '../../models/signup-status.enum';
import { RaidSignup } from '../../models/raid-signup.model';
import { GuildRosterMember } from '../../../models/guild-roster-member.model';
import { CharacterRank } from '../../../models/character-rank.enum';
import { SignupCharacterDialogComponent } from '../../components/signup-character-dialog/signup-character-dialog.component';

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

const signupModeSummary = (overrides?: Partial<RaidEventSummary>): RaidEventSummary => ({
  id: 11,
  name: 'Split 1',
  signupMode: SignupMode.Signup,
  mySignupStatus: null,
  mySignupCharacterId: null,
  mySignupSpecId: null,
  ...overrides,
});

describe('RaidDetailComponent', () => {
  let raidsService: { getEventSummary: ReturnType<typeof vi.fn>; announceGrouping: ReturnType<typeof vi.fn>; getSignups: ReturnType<typeof vi.fn>; setMySignup: ReturnType<typeof vi.fn> };
  let rosterStore: { members: ReturnType<typeof signal>; loadRoster: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  const setup = (opts?: {
    user?: User | null;
    summary?: RaidEventSummary | null;
    guildId?: string | null;
    branchId?: number;
    eventId?: number;
    members?: GuildRosterMember[];
    signups?: RaidSignup[];
  }) => {
    const summary: RaidEventSummary | null = opts?.summary === undefined ? { id: 11, name: 'Split 1' } as RaidEventSummary : opts.summary;
    raidsService = {
      getEventSummary: vi.fn().mockReturnValue(summary ? of(summary) : throwError(() => new Error('not found'))),
      announceGrouping: vi.fn().mockReturnValue(of(undefined)),
      getSignups: vi.fn().mockReturnValue(of(opts?.signups ?? [])),
      setMySignup: vi.fn().mockReturnValue(of(undefined)),
    };
    rosterStore = { members: signal(opts?.members ?? []), loadRoster: vi.fn() };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };

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
        { provide: RaidsService, useValue: raidsService },
        { provide: GuildRosterStore, useValue: rosterStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
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

  // ── constructor / raidName ────────────────────────────────────────────────

  describe('raidName', () => {
    it('fetches the event summary and sets raidName', () => {
      const component = setup({ summary: { id: 11, name: 'Split 1' } });

      expect(raidsService.getEventSummary).toHaveBeenCalledWith('g1', 7, 11);
      expect(component.raidName()).toBe('Split 1');
    });

    it('leaves raidName null when the fetch fails', () => {
      const component = setup({ summary: null });

      expect(component.raidName()).toBeNull();
    });

    it('sets signupMode and the viewer\'s own response from the summary', () => {
      const component = setup({ summary: signupModeSummary({ mySignupStatus: SignupStatus.Accepted, mySignupCharacterId: 1, mySignupSpecId: 71 }) });

      expect(component.signupMode()).toBe(SignupMode.Signup);
      expect(component.mySignupStatus()).toBe(SignupStatus.Accepted);
      expect(component.mySignupCharacterId()).toBe(1);
      expect(component.mySignupSpecId()).toBe(71);
    });

    it('does not load the roster or signups for a DefaultPresent event', () => {
      setup({ summary: { id: 11, name: 'Split 1' } as RaidEventSummary });

      expect(rosterStore.loadRoster).not.toHaveBeenCalled();
      expect(raidsService.getSignups).not.toHaveBeenCalled();
    });

    it('loads the roster for a Signup-mode event', () => {
      setup({ summary: signupModeSummary() });

      expect(rosterStore.loadRoster).toHaveBeenCalledWith('g1', 7);
    });

    it('loads signups for a Signup-mode event when the viewer is an officer', () => {
      setup({ summary: signupModeSummary(), user: fakeUser(GuildAccessLevel.Officer), signups: [signup()] });

      expect(raidsService.getSignups).toHaveBeenCalledWith('g1', 7, 11);
    });

    it('does not load signups for a Signup-mode event when the viewer is not an officer', () => {
      setup({ summary: signupModeSummary(), user: fakeUser(GuildAccessLevel.Roster) });

      expect(raidsService.getSignups).not.toHaveBeenCalled();
    });
  });

  // ── status buckets ────────────────────────────────────────────────────────

  describe('status buckets', () => {
    it('splits loaded signups into accepted/tentative/declined/no-response', () => {
      const component = setup({
        summary: signupModeSummary(),
        signups: [
          signup({ userDiscordId: 'p1', status: SignupStatus.Accepted }),
          signup({ userDiscordId: 'p2', status: SignupStatus.Tentative }),
          signup({ userDiscordId: 'p3', status: SignupStatus.Declined }),
          signup({ userDiscordId: 'p4', status: null }),
        ],
      });

      expect(component.acceptedSignups().map((s) => s.userDiscordId)).toEqual(['p1']);
      expect(component.tentativeSignups().map((s) => s.userDiscordId)).toEqual(['p2']);
      expect(component.declinedSignups().map((s) => s.userDiscordId)).toEqual(['p3']);
      expect(component.noResponseSignups().map((s) => s.userDiscordId)).toEqual(['p4']);
    });

    it('falls back to an empty signups list when the load fails', () => {
      raidsService = {
        getEventSummary: vi.fn().mockReturnValue(of(signupModeSummary())),
        announceGrouping: vi.fn().mockReturnValue(of(undefined)),
        getSignups: vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
        setMySignup: vi.fn().mockReturnValue(of(undefined)),
      };
      rosterStore = { members: signal([]), loadRoster: vi.fn() };
      TestBed.configureTestingModule({
        imports: [RaidDetailComponent],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: { get: (key: string) => (key === 'branchId' ? '7' : key === 'eventId' ? '11' : 'g1') } },
              paramMap: of(convertToParamMap({ id: 'g1', branchId: '7', eventId: '11' })),
              parent: { snapshot: { paramMap: { get: () => 'g1' } }, paramMap: of(convertToParamMap({ id: 'g1' })) },
            },
          },
          { provide: AuthStore, useValue: { user: signal(fakeUser(GuildAccessLevel.Officer)) } },
          { provide: RaidsService, useValue: raidsService },
          { provide: GuildRosterStore, useValue: rosterStore },
          { provide: SnackbarService, useValue: { success: vi.fn(), error: vi.fn() } },
          { provide: Dialog, useValue: { open: vi.fn() } },
        ],
      }).overrideComponent(RaidDetailComponent, { set: { template: '', imports: [] } });
      const component = TestBed.createComponent(RaidDetailComponent).componentInstance;

      expect(component.signups()).toEqual([]);
    });
  });

  // ── myCharacters ──────────────────────────────────────────────────────────

  describe('myCharacters', () => {
    it('filters the roster down to the current user\'s own characters', () => {
      const component = setup({ members: [member({ playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-2' })] });

      expect(component.myCharacters().map((c) => c.characterId)).toEqual([1]);
    });

    it('is empty with no authenticated user', () => {
      const component = setup({ user: null, members: [member()] });
      expect(component.myCharacters()).toEqual([]);
    });

    it('falls back to an empty roster while the store has not loaded any members yet', () => {
      const component = setup();
      rosterStore.members.set(null);
      expect(component.myCharacters()).toEqual([]);
    });
  });

  // ── setSignup ─────────────────────────────────────────────────────────────

  describe('setSignup', () => {
    it('submits a Declined response directly, with no character/spec', () => {
      const component = setup({ members: [member()] });

      component.setSignup(SignupStatus.Declined);

      expect(raidsService.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Declined, null, null);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('auto-submits Accepted when the viewer has exactly one character with at most one spec', () => {
      const component = setup({ members: [member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }] })] });

      component.setSignup(SignupStatus.Accepted);

      expect(raidsService.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Accepted, 1, 71);
    });

    it('auto-submits with a null spec when the single character has no raid specs at all', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });

      component.setSignup(SignupStatus.Tentative);

      expect(raidsService.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Tentative, 1, null);
    });

    it('opens the character picker when the viewer has more than one character', () => {
      const component = setup({
        summary: signupModeSummary(),
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(dialog.open).toHaveBeenCalledWith(
        SignupCharacterDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ currentCharacterId: null, currentSpecId: null }) }),
      );
      expect(raidsService.setMySignup).not.toHaveBeenCalled();
    });

    it('opens the character picker when the single character has more than one raid spec', () => {
      const component = setup({
        members: [member({ raidSpecs: [{ specId: 71, name: 'Arms', iconUrl: null, isMain: true }, { specId: 72, name: 'Fury', iconUrl: null, isMain: false }] })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(dialog.open).toHaveBeenCalled();
      expect(raidsService.setMySignup).not.toHaveBeenCalled();
    });

    it('submits the picker result on close', () => {
      const component = setup({
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of({ characterId: 5, specId: 99 }) });

      component.setSignup(SignupStatus.Accepted);

      expect(raidsService.setMySignup).toHaveBeenCalledWith('g1', 7, 11, SignupStatus.Accepted, 5, 99);
    });

    it('does nothing when the picker is dismissed (null result)', () => {
      const component = setup({
        members: [member({ characterId: 1, playerDiscordId: 'player-1' }), member({ characterId: 2, playerDiscordId: 'player-1' })],
      });
      dialog.open.mockReturnValue({ closed: of(null) });

      component.setSignup(SignupStatus.Accepted);

      expect(raidsService.setMySignup).not.toHaveBeenCalled();
    });
  });

  // ── #submitSignup (via setSignup) ────────────────────────────────────────

  describe('#submitSignup', () => {
    it('updates mySignupStatus/Character/Spec and clears savingSignup on success', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });

      component.setSignup(SignupStatus.Declined);

      expect(component.mySignupStatus()).toBe(SignupStatus.Declined);
      expect(component.mySignupCharacterId()).toBeNull();
      expect(component.mySignupSpecId()).toBeNull();
      expect(component.savingSignup()).toBe(false);
    });

    it('reloads signups after a successful submission when the viewer is an officer', () => {
      const component = setup({ members: [member({ raidSpecs: [] })], user: fakeUser(GuildAccessLevel.Officer) });
      raidsService.getSignups.mockClear();

      component.setSignup(SignupStatus.Declined);

      expect(raidsService.getSignups).toHaveBeenCalledWith('g1', 7, 11);
    });

    it('does not reload signups when the viewer is not an officer', () => {
      const component = setup({ members: [member({ raidSpecs: [] })], user: fakeUser(GuildAccessLevel.Roster) });

      component.setSignup(SignupStatus.Declined);

      expect(raidsService.getSignups).not.toHaveBeenCalled();
    });

    it('shows an error snackbar and clears savingSignup on failure', () => {
      const component = setup({ members: [member({ raidSpecs: [] })] });
      raidsService.setMySignup.mockReturnValue(throwError(() => new Error('boom')));

      component.setSignup(SignupStatus.Declined);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.signup.saveFailed');
      expect(component.savingSignup()).toBe(false);
    });
  });

  // ── breadcrumbs ───────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the raid name as the leaf label once loaded', () => {
      const component = setup({ summary: { id: 11, name: 'Split 1' } });

      expect(component.breadcrumbs().at(-1)).toEqual({ label: 'Split 1' });
    });

    it('falls back to the generic breadcrumb key while the name is not yet loaded', () => {
      const component = setup({ summary: null });

      expect(component.breadcrumbs().at(-1)).toEqual({ i18nKey: 'raidBuilder.detail.breadcrumb' });
    });

    it('links the raid-builder crumb to the branch\'s raids page', () => {
      const component = setup({ guildId: 'g1', branchId: 7 });

      expect(component.breadcrumbs()[1]).toEqual({ i18nKey: 'sidenav.guild.raidBuilder', link: ['/guilds', 'g1', '7', 'raids'] });
    });
  });

  // ── isOfficer ─────────────────────────────────────────────────────────────

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

      expect(dialog.open).toHaveBeenCalledWith(expect.anything(), {
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
