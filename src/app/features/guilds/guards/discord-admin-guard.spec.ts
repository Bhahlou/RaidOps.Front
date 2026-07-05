import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { discordAdminGuard } from './discord-admin-guard';
import { AuthStore } from '../../../core/stores/auth.store';
import { User } from '../../../core/models/user.model';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const makeRoute = (id: string | null): ActivatedRouteSnapshot =>
  ({ paramMap: convertToParamMap(id ? { id } : {}) }) as unknown as ActivatedRouteSnapshot;

const makeUser = (guilds: User['guilds']): User => ({
  discordId: '123',
  name: 'Test',
  avatarHash: null,
  guilds,
  notifications: [],
});

describe('discordAdminGuard', () => {
  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => discordAdminGuard(...args));

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

  it('returns true when user is admin of the guild matching the route param', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: true, accessLevel: GuildAccessLevel.Officer }]));

    expect(executeGuard(makeRoute('g1'), {} as any)).toBe(true);
  });

  it('redirects to /no-guild when user is not admin of the guild', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: false, accessLevel: GuildAccessLevel.Public }]));
    const router = TestBed.inject(Router);

    const result = executeGuard(makeRoute('g1'), {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });

  it('redirects to /no-guild when guild id does not match any user guild', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: true, accessLevel: GuildAccessLevel.Officer }]));
    const router = TestBed.inject(Router);

    const result = executeGuard(makeRoute('other-id'), {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });

  it('redirects to /no-guild when route has no id param', () => {
    userSignal.set(makeUser([{ id: 'g1', name: 'Guild', iconHash: null, isRegistered: false, isConfigured: false, isAdmin: true, accessLevel: GuildAccessLevel.Officer }]));
    const router = TestBed.inject(Router);

    const result = executeGuard(makeRoute(null), {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });

  it('redirects to /no-guild when user is null', () => {
    const router = TestBed.inject(Router);

    const result = executeGuard(makeRoute('g1'), {} as any);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/no-guild');
  });
});
