import { RosterMode } from './roster-mode.enum';
import { SignupMode } from './signup-mode.enum';

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
  /** Blizzard API region this branch's realm sits in ("eu"/"us"/"kr"/"tw"), or null until an officer configures it. */
  region: GuildBranchRegion | null;
  /** Default signup mode for new raid events on this branch, or null until an officer configures it. */
  signupMode: SignupMode | null;
}

/** Body of the roster-settings PATCH — guildId/guildBranchId are set by the route, not this payload. */
export interface GuildBranchRosterSettings {
  rosterMode: RosterMode;
  rosterRoleIds: string[];
  officerRoleIds: string[];
}

/** Blizzard API region — determines which weekly raid-lockout reset schedule a guild branch follows. */
export type GuildBranchRegion = 'eu' | 'us' | 'kr' | 'tw';
