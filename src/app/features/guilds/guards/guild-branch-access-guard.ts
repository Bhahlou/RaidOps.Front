import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../core/models/guild-access-level.enum';

/**
 * Protects child routes of `/guilds/:id/:branchId` (dashboard, roster, loot...) based on each
 * route's `data.minAccessLevel` (defaults to Public when unset), checked against the specific
 * branch's access level rather than the guild-wide max — see `guildAccessGuard` for that one.
 *
 * - No relation to this guild at all → redirect to `/guilds`.
 * - Branch doesn't exist (deactivated, bad URL) → redirect to the bare `/guilds/:id`, letting
 *   `guildDefaultBranchGuard` re-resolve a valid branch — never back into this same branch id,
 *   which would just loop.
 * - Insufficient tier for this specific child → redirect to this branch's dashboard
 *   (Public-tier, always allowed — no redirect loop).
 */
export const guildBranchAccessGuard: CanActivateChildFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const guildId = route.paramMap.get('id');
  const branchId = Number(route.paramMap.get('branchId'));

  const guild = authStore.user()?.guilds.find((g) => g.id === guildId);
  if (!guild) {
    return router.createUrlTree(['/guilds']);
  }

  const branch = guild.branches.find((b) => b.id === branchId);
  if (!branch) {
    return router.createUrlTree(['/guilds', guildId]);
  }

  const requiredLevel = (route.data['minAccessLevel'] as GuildAccessLevel) ?? GuildAccessLevel.Public;
  if (hasGuildAccess(branch.accessLevel, requiredLevel)) {
    return true;
  }

  return router.createUrlTree(['/guilds', guildId, branchId, 'dashboard']);
};
