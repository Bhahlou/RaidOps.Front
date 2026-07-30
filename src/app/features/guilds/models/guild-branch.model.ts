import { RosterMode } from './roster-mode.enum';

/** One WoW game-version branch activated on a guild, with its roster/officer role-set configuration. */
export interface GuildBranch {
  id: number;
  branchId: number;
  branchName: string;
  isActive: boolean;
  /** Null until the guild owner completes the roster settings step for this branch. */
  rosterMode: RosterMode | null;
  /** Discord snowflake IDs of the roles that grant roster access. Holding any one is sufficient. */
  rosterRoleIds: string[];
  /** Discord snowflake IDs of the roles that grant Officer access. Holding any one is sufficient. */
  officerRoleIds: string[];
}

/** Body of the roster-settings PATCH — guildId/guildBranchId are set by the route, not this payload. */
export interface GuildBranchRosterSettings {
  rosterMode: RosterMode;
  rosterRoleIds: string[];
  officerRoleIds: string[];
}
