import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { guildAccessGuard } from './guild-access-guard';
import { AuthStore } from '../../../core/stores/auth.store';
import { User } from '../../../core/models/user.model';
import { UserGuild } from '../../../core/models/user-guild.model';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'Test',
  avatarHash: null,
  guilds,
});

describe('guildAccessGuard', () => {
  let userSignal: ReturnType<typeof signal<User | null>>;

  const execute = (guildId: string | null, minAccessLevel?: GuildAccessLevel) => {
    const parent = { paramMap: { get: () => guildId } } as unknown as ActivatedRouteSnapshot;
    const route = { parent, data: minAccessLevel ? { minAccessLevel } : {} } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guildAccessGuard(route, state));
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

  it('allows access when no minAccessLevel is set and the guild is in the user list', () => {
    userSignal.set(makeUser([makeGuild({ id: 'g1', accessLevel: GuildAccessLevel.Public })]));

    expect(execute('g1')).toBe(true);
  });

  it('allows access when the user meets the required level exactly', () => {
    userSignal.set(makeUser([makeGuild({ id: 'g1', accessLevel: GuildAccessLevel.Roster })]));

    expect(execute('g1', GuildAccessLevel.Roster)).toBe(true);
  });

  it('allows access when the user exceeds the required level', () => {
    userSignal.set(makeUser([makeGuild({ id: 'g1', accessLevel: GuildAccessLevel.Officer })]));

    expect(execute('g1', GuildAccessLevel.Roster)).toBe(true);
  });

  it('redirects to the guild dashboard when the user is below the required level', () => {
    userSignal.set(makeUser([makeGuild({ id: 'g1', accessLevel: GuildAccessLevel.Public })]));
    const router = TestBed.inject(Router);

    const result = execute('g1', GuildAccessLevel.Officer);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds/g1/dashboard');
  });

  it('redirects to /guilds when the user has no relation to this guild', () => {
    userSignal.set(makeUser([makeGuild({ id: 'other-guild' })]));
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });

  it('redirects to /guilds when the user is null', () => {
    const router = TestBed.inject(Router);

    const result = execute('g1');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/guilds');
  });
});
