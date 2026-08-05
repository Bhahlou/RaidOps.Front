import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { guildDefaultBranchGuard } from './guild-default-branch-guard';
import { setLastVisitedBranchId } from '../utils/last-visited-branch.util';
import { AuthStore } from '../../../core/stores/auth.store';
import { User } from '../../../core/models/user.model';
import { UserGuild } from '../../../core/models/user-guild.model';
import { UserGuildBranch } from '../../../core/models/user-guild-branch.model';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const makeBranch = (overrides: Partial<UserGuildBranch> = {}): UserGuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Anniversary',
  accessLevel: GuildAccessLevel.Public,
  hasActiveCharacter: true,
  ...overrides,
});

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  branches: [],
  accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'Test',
  avatarHash: null,
  guilds,
  notifications: [],
  seenChangelogEntryIds: [],
});

describe('guildDefaultBranchGuard', () => {
  let userSignal: ReturnType<typeof signal<User | null>>;

  const execute = (guildId: string | null) => {
    const route = { paramMap: { get: () => guildId } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guildDefaultBranchGuard(route, state));
  };

  beforeEach(() => {
    userSignal = signal<User | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: userSignal.asReadonly() } },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('resolves to the first branch\'s dashboard when nothing was previously visited', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7 }), makeBranch({ id: 8 })] })]),
    );
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/7/dashboard');
  });

  it('resolves to the last-visited branch when it still exists', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7 }), makeBranch({ id: 8 })] })]),
    );
    setLastVisitedBranchId('g1', 8);
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/8/dashboard');
  });

  it('falls back to the first branch when the last-visited one no longer exists', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7 }), makeBranch({ id: 8 })] })]),
    );
    setLastVisitedBranchId('g1', 99);
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/7/dashboard');
  });

  it('sends an admin to activate a branch when the guild has none active', () => {
    userSignal.set(makeUser([makeGuild({ branches: [], isAdmin: true })]));
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/settings/branches');
  });

  it('redirects a non-admin to /guilds when the guild has no active branch', () => {
    userSignal.set(makeUser([makeGuild({ branches: [], isAdmin: false })]));
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });

  it('redirects to /guilds when the user has no relation to this guild', () => {
    userSignal.set(makeUser([makeGuild({ id: 'other-guild' })]));
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });

  it('redirects to /guilds when the user is null', () => {
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });
});
