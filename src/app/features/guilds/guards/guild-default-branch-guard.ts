import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { getLastVisitedBranchId } from '../utils/last-visited-branch.util';

/**
 * Guards the empty-path child of `/guilds/:id` — always returns a `UrlTree`, never `true`,
 * resolving which branch to actually land on (the URL alone doesn't say).
 *
 * Priority: the branch last visited on this guild (localStorage), falling back to the first
 * active branch. That fallback is safe by construction, not just assumed — `guild.branches`
 * only ever lists active branches this specific user has at least Public access to
 * (`GetMeQueryHandler`/`GuildAccessService.ComputeAccessLevel` never omit a branch or return a
 * "no access" level for a guild the user is eligible for in the first place).
 */
export const guildDefaultBranchGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const guildId = route.paramMap.get('id')!;
  const guild = authStore.user()?.guilds.find((g) => g.id === guildId);
  if (!guild) {
    return router.createUrlTree(['/guilds']);
  }

  if (guild.branches.length === 0) {
    // Freshly-registered guild, or every branch deactivated. Admins go activate one; everyone
    // else has nothing to see here yet.
    return guild.isAdmin
      ? router.createUrlTree(['/guilds', guildId, 'settings', 'branches'])
      : router.createUrlTree(['/guilds']);
  }

  const lastVisited = getLastVisitedBranchId(guildId);
  const branch = guild.branches.find((b) => b.id === lastVisited) ?? guild.branches[0];
  return router.createUrlTree(['/guilds', guildId, branch.id, 'dashboard']);
};
