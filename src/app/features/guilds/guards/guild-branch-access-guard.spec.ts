import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { guildBranchAccessGuard } from './guild-branch-access-guard';
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
});

describe('guildBranchAccessGuard', () => {
  let userSignal: ReturnType<typeof signal<User | null>>;

  const execute = (guildId: string | null, branchId: number | null, minAccessLevel?: GuildAccessLevel) => {
    const route = {
      paramMap: { get: (key: string) => (key === 'id' ? guildId : key === 'branchId' ? String(branchId) : null) },
      data: minAccessLevel ? { minAccessLevel } : {},
    } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guildBranchAccessGuard(route, state));
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

  it('allows access when no minAccessLevel is set and the branch exists', () => {
    userSignal.set(makeUser([makeGuild({ branches: [makeBranch({ id: 7 })] })]));

    expect(execute('g1', 7)).toBe(true);
  });

  it('allows access when the branch meets the required level exactly', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7, accessLevel: GuildAccessLevel.Roster })] })]),
    );

    expect(execute('g1', 7, GuildAccessLevel.Roster)).toBe(true);
  });

  it('allows access when the branch exceeds the required level', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7, accessLevel: GuildAccessLevel.Officer })] })]),
    );

    expect(execute('g1', 7, GuildAccessLevel.Roster)).toBe(true);
  });

  it('redirects to this branch\'s dashboard when the branch is below the required level', () => {
    userSignal.set(
      makeUser([makeGuild({ branches: [makeBranch({ id: 7, accessLevel: GuildAccessLevel.Public })] })]),
    );
    const router = TestBed.inject(Router);

    const result = execute('g1', 7, GuildAccessLevel.Officer);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/7/dashboard');
  });

  it('redirects to the bare guild path when the branch does not exist on this guild', () => {
    userSignal.set(makeUser([makeGuild({ branches: [makeBranch({ id: 7 })] })]));
    const router = TestBed.inject(Router);

    const result = execute('g1', 99);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1');
  });

  it('redirects to /guilds when the user has no relation to this guild', () => {
    userSignal.set(makeUser([makeGuild({ id: 'other-guild' })]));
    const router = TestBed.inject(Router);

    const result = execute('g1', 7);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });

  it('redirects to /guilds when the user is null', () => {
    const router = TestBed.inject(Router);

    const result = execute('g1', 7);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });
});
