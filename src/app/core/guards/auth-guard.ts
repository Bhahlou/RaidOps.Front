import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

/**
 * Protects routes that require an authenticated user.
 *
 * - If the user signal is already populated (sessionStorage restored on startup) → allow immediately.
 * - Otherwise tries to load the user from the API (valid cookie = silent success).
 * - On failure → redirects to /home.
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return authStore.loadUser().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/home']))),
  );
};
