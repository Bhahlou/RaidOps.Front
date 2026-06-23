/** A user's access level on a given guild, from least to most privileged. */
export enum GuildAccessLevel {
  Public = 'Public',
  Roster = 'Roster',
  Officer = 'Officer',
}

const ACCESS_LEVEL_RANK: Record<GuildAccessLevel, number> = {
  [GuildAccessLevel.Public]: 1,
  [GuildAccessLevel.Roster]: 2,
  [GuildAccessLevel.Officer]: 3,
};

/** True when `level` grants at least as much access as `required`. */
export function hasGuildAccess(level: GuildAccessLevel, required: GuildAccessLevel): boolean {
  return ACCESS_LEVEL_RANK[level] >= ACCESS_LEVEL_RANK[required];
}
