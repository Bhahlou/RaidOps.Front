import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';

import { adminGuard } from './admin-guard';
import { AuthStore } from '../stores/auth.store';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...args) => TestBed.runInInjectionContext(() => adminGuard(...args));

  let isAdmin: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    isAdmin = signal(false);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: { isAdmin: isAdmin.asReadonly() } }],
    });
  });

  it('returns true when the user is an admin', () => {
    isAdmin.set(true);

    expect(executeGuard({} as never, {} as never)).toBe(true);
  });

  it('redirects to /home when the user is not an admin', () => {
    const result = executeGuard({} as never, {} as never) as UrlTree;

    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/home');
  });
});
