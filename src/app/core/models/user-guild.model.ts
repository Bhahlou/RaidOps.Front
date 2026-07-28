import { GuildAccessLevel } from './guild-access-level.enum';
import { UserGuildBranch } from './user-guild-branch.model';

export interface UserGuild {
  id: string;
  name: string;
  iconHash: string | null;
  isRegistered: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  /** Active WoW branches on this guild the user has access to, each with its own access level. */
  branches: UserGuildBranch[];
  /** Highest access level anywhere on this guild — Officer if Discord admin, otherwise max across branches. */
  accessLevel: GuildAccessLevel;
}
