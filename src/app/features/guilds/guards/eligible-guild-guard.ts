import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Protects guild routes that require at least one registered guild.
 *
 * - If the user belongs to at least one registered guild → allow.
 * - Otherwise → redirects to /no-guild so the user can register one.
 */
export const eligibleGuildGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const user = authStore.user();
  if (user && user.guilds.some((g) => g.isRegistered)) {
    return true;
  }

  return router.createUrlTree(['/no-guild']);
};
