import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { eligibleGuildGuard } from './eligible-guild-guard';
import { AuthStore } from '../../../core/stores/auth.store';
import { User } from '../../../core/models/user.model';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const makeUser = (guilds: User['guilds']): User => ({
  discordId: '123',
  name: 'Test',
  avatarHash: null,
  guilds,
});

describe('eligibleGuildGuard', () => {
  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => eligibleGuildGuard(...args));

  let userSignal: ReturnType<typeof signal<User | null>>;

  beforeEach(() => {
    userSignal = signal<User | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user: userSignal.asReadonly() },
        },
      ],
    });
  });

  it('returns true when user has a registered guild', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: true, isConfigured: false, isAdmin: false, accessLevel: GuildAccessLevel.Public }]));

    expect(executeGuard({} as any, {} as any)).toBe(true);
  });

  it('returns true when user is admin of an unregistered guild', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: true, accessLevel: GuildAccessLevel.Officer }]));

    expect(executeGuard({} as any, {} as any)).toBe(true);
  });

  it('redirects to /no-guild when user has only non-admin unregistered guilds', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: false, accessLevel: GuildAccessLevel.Public }]));
    const router = TestBed.inject(Router);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });

  it('redirects to /no-guild when user has no guilds', () => {
    userSignal.set(makeUser([]));
    const router = TestBed.inject(Router);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });

  it('redirects to /no-guild when user is null', () => {
    const router = TestBed.inject(Router);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });
});
