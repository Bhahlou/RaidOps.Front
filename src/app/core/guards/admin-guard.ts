import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

/**
 * Protects owner-only routes. Meant to run after `authGuard` (the user is already loaded); non-owners
 * are sent to /home. Purely cosmetic — every admin endpoint enforces ownership server-side.
 */
export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.isAdmin() ? true : router.createUrlTree(['/home']);
};
