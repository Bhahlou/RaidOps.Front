import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../core/models/guild-access-level.enum';

/**
 * Protects child routes of `/guilds/:id` (calendar, loot, settings, audit-log...) based on each
 * route's `data.minAccessLevel` (defaults to Public when unset).
 *
 * Registered as `canActivateChild` on the parent route rather than `canActivate` on each child —
 * `canActivate` on the `:id` parent only fires when entering the guild, not when navigating
 * between its children, so it can't gate per-child access on its own.
 *
 * - No relation to this guild at all → redirect to `/guilds`.
 * - Insufficient tier for this specific child → redirect to the guild's dashboard (Public-tier,
 *   always allowed for a guild the user has any relation to — no redirect loop).
 */
export const guildAccessGuard: CanActivateChildFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const guildId = route.parent?.paramMap.get('id');
  const guild = authStore.user()?.guilds.find((g) => g.id === guildId);
  if (!guild) {
    return router.createUrlTree(['/guilds']);
  }

  const requiredLevel = (route.data['minAccessLevel'] as GuildAccessLevel) ?? GuildAccessLevel.Public;
  if (hasGuildAccess(guild.accessLevel, requiredLevel)) {
    return true;
  }

  return router.createUrlTree(['/guilds', guildId, 'dashboard']);
};
