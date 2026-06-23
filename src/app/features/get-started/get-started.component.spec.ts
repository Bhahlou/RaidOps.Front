import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { GetStartedComponent } from './get-started.component';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CharacterStore } from '../characters/stores/character.store';
import { User } from '../../core/models/user.model';
import { UserGuild } from '../../core/models/user-guild.model';
import { Character } from '../characters/models/character.model';
import { GuildAccessLevel } from '../../core/models/guild-access-level.enum';
import { GuildMembership } from '../guilds/models/guild-membership.model';
import { CharacterRank } from '../guilds/models/character-rank.enum';

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1', name: 'Guild', iconHash: null,
  isRegistered: false, isConfigured: false, isAdmin: false,
  accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

const makeChar = (id: number, overrides: Partial<Character> = {}): Character => ({
  id, name: `Char${id}`, classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Retail', realmName: 'Silvermoon', realmSlug: 'silvermoon',
  level: 80, itemLevel: null, avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [],
  guildMemberships: [],
  ...overrides,
});

const makeMembership = (guildId: string): GuildMembership => ({
  guildId, guildName: `Guild ${guildId}`, guildIconHash: null,
  characterRank: CharacterRank.Main, joinedAt: '2025-01-01',
});

describe('GetStartedComponent', () => {
  let component: GetStartedComponent;
  let userSignal: ReturnType<typeof signal<User | null>>;
  let isBnetLinkedSignal: ReturnType<typeof signal<boolean>>;
  let characterListSignal: ReturnType<typeof signal<Character[]>>;
  let isCharactersLoadingSignal: ReturnType<typeof signal<boolean>>;
  let loadCharacters: ReturnType<typeof vi.fn>;
  let loadUser: ReturnType<typeof vi.fn>;
  let signupFn: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let snackbarMock: { error: ReturnType<typeof vi.fn> };
  let routeGet: ReturnType<typeof vi.fn>;

  const setup = (user: User | null, characters: Character[] = [], errorParam: string | null = null) => {
    userSignal = signal(user);
    isBnetLinkedSignal = signal(characters.length > 0);
    characterListSignal = signal(characters);
    isCharactersLoadingSignal = signal(false);
    loadCharacters = vi.fn().mockReturnValue(of(characters));
    loadUser = vi.fn().mockReturnValue(of(user));
    signupFn = vi.fn();
    navigate = vi.fn();
    snackbarMock = { error: vi.fn() };
    routeGet = vi.fn().mockReturnValue(errorParam);

    TestBed.configureTestingModule({
      imports: [GetStartedComponent],
      providers: [
        { provide: AuthStore, useValue: { user: userSignal.asReadonly(), isAuthenticated: () => user !== null, loadUser } },
        { provide: AuthService, useValue: { signup: signupFn } },
        { provide: SnackbarService, useValue: snackbarMock },
        {
          provide: CharacterStore,
          useValue: {
            isBnetLinked: isBnetLinkedSignal,
            characterList: characterListSignal,
            isCharactersLoading: isCharactersLoadingSignal,
            loadCharacters,
          },
        },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: routeGet } } } },
      ],
    });
    TestBed.overrideComponent(GetStartedComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(GetStartedComponent).componentInstance;
  };

  describe('isGuildStepDone', () => {
    it('is false with no user', () => {
      setup(null);
      expect(component.isGuildStepDone()).toBe(false);
    });

    it('is false when no guild is registered+configured', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [makeGuild({ isRegistered: true, isConfigured: false })] });
      expect(component.isGuildStepDone()).toBe(false);
    });

    it('is true when at least one guild is registered+configured', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [makeGuild({ isRegistered: true, isConfigured: true })] });
      expect(component.isGuildStepDone()).toBe(true);
    });
  });

  describe('isBnetStepDone', () => {
    it('is false when bnet is not linked', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      isBnetLinkedSignal.set(false);
      expect(component.isBnetStepDone()).toBe(false);
    });

    it('is false when linked but no character is activated', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      isBnetLinkedSignal.set(true);
      characterListSignal.set([]);
      expect(component.isBnetStepDone()).toBe(false);
    });

    it('is true when linked and at least one character is activated', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] }, [makeChar(1)]);
      isBnetLinkedSignal.set(true);
      expect(component.isBnetStepDone()).toBe(true);
    });
  });

  describe('isLinkStepDone', () => {
    it('is false when no character has a guild membership', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] }, [makeChar(1)]);
      expect(component.isLinkStepDone()).toBe(false);
    });

    it('is true when a character has a guild membership', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] }, [makeChar(1, { guildMemberships: [makeMembership('g1')] })]);
      expect(component.isLinkStepDone()).toBe(true);
    });
  });

  describe('stepIndex', () => {
    it('is 0 when not authenticated', () => {
      setup(null);
      expect(component.stepIndex()).toBe(0);
    });

    it('is 1 when authenticated but no guild is ready', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      expect(component.stepIndex()).toBe(1);
    });

    it('stays at 1 when the guild is ready but not yet acknowledged, even on a fresh session', () => {
      // A returning user whose guild was already registered in a previous session must still
      // land on the guild step and see its confirmation — not be silently fast-forwarded.
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [makeGuild({ isRegistered: true, isConfigured: true })] });
      expect(component.stepIndex()).toBe(1);
    });

    it('is 2 once the guild step is explicitly acknowledged and bnet step is not done', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [makeGuild({ isRegistered: true, isConfigured: true })] });
      component.continuePastGuildStep();
      expect(component.stepIndex()).toBe(2);
    });

    it('is 3 when guild step is acknowledged and bnet step is done', () => {
      setup(
        { discordId: '1', name: 'U', avatarHash: null, guilds: [makeGuild({ isRegistered: true, isConfigured: true })] },
        [makeChar(1)],
      );
      isBnetLinkedSignal.set(true);
      component.continuePastGuildStep();
      expect(component.stepIndex()).toBe(3);
    });
  });

  describe('isResolving', () => {
    it('is true right after init while authenticated (user refresh not settled yet)', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      loadUser.mockReturnValue(new Subject());
      component.ngOnInit();
      expect(component.isResolving()).toBe(true);
    });

    it('is false once the user refresh settles and characters are loaded', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      component.ngOnInit();
      expect(component.isResolving()).toBe(false);
    });

    it('is false when not authenticated, even before ngOnInit runs', () => {
      setup(null);
      expect(component.isResolving()).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('does nothing when not authenticated', () => {
      setup(null);
      component.ngOnInit();
      expect(loadCharacters).not.toHaveBeenCalled();
      expect(loadUser).not.toHaveBeenCalled();
    });

    it('refreshes the user and loads characters when authenticated', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      component.ngOnInit();
      expect(loadUser).toHaveBeenCalled();
      expect(loadCharacters).toHaveBeenCalled();
    });

    it('clears isResolving even if the user refresh fails', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] });
      loadUser.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.isResolving()).toBe(false);
    });

    it('redirects to /guilds when the link step is already done after loading', () => {
      setup(
        { discordId: '1', name: 'U', avatarHash: null, guilds: [] },
        [makeChar(1, { guildMemberships: [makeMembership('g1')] })],
      );
      component.ngOnInit();
      expect(navigate).toHaveBeenCalledWith(['/guilds']);
    });

    it('does not redirect when the link step is not done', () => {
      setup({ discordId: '1', name: 'U', avatarHash: null, guilds: [] }, [makeChar(1)]);
      component.ngOnInit();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    it('calls authService.signup with returnTo=get-started', () => {
      setup(null);
      component.signup();
      expect(signupFn).toHaveBeenCalledWith('get-started');
    });
  });

  describe('Discord login cancellation', () => {
    it('shows a snackbar on init when the login was cancelled', () => {
      vi.useFakeTimers();
      setup(null, [], 'access_denied');
      component.ngOnInit();
      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).toHaveBeenCalledWith('errors.discordLoginCancelled');
      vi.useRealTimers();
    });

    it('does nothing when there is no error param', () => {
      vi.useFakeTimers();
      setup(null, [], null);
      component.ngOnInit();
      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
