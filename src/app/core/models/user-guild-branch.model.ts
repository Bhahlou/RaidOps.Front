import { GuildAccessLevel } from './guild-access-level.enum';

/** One active WoW branch on a guild the authenticated user belongs to, with their access level on it. */
export interface UserGuildBranch {
  id: number;
  branchId: number;
  branchName: string;
  accessLevel: GuildAccessLevel;
  /** Whether the user has an active roster character on this branch specifically, as opposed to merely a Discord role granting access. */
  hasActiveCharacter: boolean;
}
