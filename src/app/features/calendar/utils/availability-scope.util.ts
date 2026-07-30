import { SelectOption } from '../../../shared/components/form/select/select.component';
import { UserGuild } from '../../../core/models/user-guild.model';

/** A declaration's scope: Global (both null) or a specific guild branch (both set). */
export interface AvailabilityScope {
  guildId: string | null;
  guildBranchId: number | null;
}

/** `app-select` needs a stable primitive value (object identity can't survive `guilds()` recomputing), so scopes are encoded as this string key. */
const GLOBAL_SCOPE_KEY = '__global__';

export function scopeToKey(scope: AvailabilityScope): string {
  return scope.guildId === null ? GLOBAL_SCOPE_KEY : `${scope.guildId}:${scope.guildBranchId}`;
}

export function scopeFromKey(key: string): AvailabilityScope {
  if (key === GLOBAL_SCOPE_KEY) return { guildId: null, guildBranchId: null };
  const [guildId, branchId] = key.split(':');
  return { guildId, guildBranchId: Number(branchId) };
}

/**
 * Options for the scope picker: Global plus one entry per branch where the user has an active
 * roster character (a Discord-role-only branch offers nothing to fan out a declaration to),
 * grouped by guild.
 */
export function buildScopeOptions(guilds: UserGuild[], globalLabel: string): SelectOption<string>[] {
  const branchOptions = guilds.flatMap((guild) =>
    guild.branches
      .filter((branch) => branch.hasActiveCharacter)
      .map((branch) => ({
        value: scopeToKey({ guildId: guild.id, guildBranchId: branch.id }),
        label: branch.branchName,
        group: guild.name,
      })),
  );
  return [{ value: GLOBAL_SCOPE_KEY, label: globalLabel }, ...branchOptions];
}
