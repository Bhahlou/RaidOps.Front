import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Protects the guild-register route.
 *
 * - Checks that the user holds admin rights on the Discord guild identified by the :id route param.
 * - If not → redirects to /no-guild.
 */
export const discordAdminGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const guildId = route.paramMap.get('id');
  const user = authStore.user();

  if (user && guildId && user.guilds.some((g) => g.id === guildId && g.isAdmin)) {
    return true;
  }

  return router.createUrlTree(['/no-guild']);
};
