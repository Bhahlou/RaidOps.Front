import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Protects the /guilds route.
 *
 * Allows access when the user has at least one registered guild
 * OR is admin of at least one unregistered guild (so they can register it).
 * Otherwise redirects to /no-guild.
 */
export const eligibleGuildGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const guilds = authStore.user()?.guilds ?? [];
  const hasEligibleGuild =
    guilds.some(g => g.isRegistered) ||
    guilds.some(g => g.isAdmin && !g.isRegistered);

  return hasEligibleGuild ? true : router.createUrlTree(['/no-guild']);
};
