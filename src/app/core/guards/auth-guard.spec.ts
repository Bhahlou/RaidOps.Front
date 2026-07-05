import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { computed, signal } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authGuard } from './auth-guard';
import { AuthStore } from '../stores/auth.store';
import { User } from '../models/user.model';

const mockUser: User = { discordId: '123', name: 'Test', avatarHash: null, guilds: [], notifications: [] };

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => authGuard(...args));

  let userSignal: ReturnType<typeof signal<User | null>>;
  let loadUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    userSignal = signal<User | null>(null);
    loadUser = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            user: userSignal.asReadonly(),
            isAuthenticated: computed(() => userSignal() !== null),
            loadUser,
          },
        },
      ],
    });
  });

  it('returns true immediately when user is already authenticated', () => {
    userSignal.set(mockUser);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    expect(loadUser).not.toHaveBeenCalled();
  });

  it('returns true when loadUser succeeds', async () => {
    loadUser.mockReturnValue(of(mockUser));

    const result = await firstValueFrom(executeGuard({} as any, {} as any) as any);

    expect(result).toBe(true);
  });

  it('redirects to /home when loadUser fails', async () => {
    loadUser.mockReturnValue(throwError(() => new Error('401')));

    const result = await firstValueFrom(executeGuard({} as any, {} as any) as any);
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });
});
