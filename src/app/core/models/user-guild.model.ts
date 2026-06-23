import { GuildAccessLevel } from './guild-access-level.enum';

export interface UserGuild {
  id: string;
  name: string;
  iconHash: string | null;
  isRegistered: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  accessLevel: GuildAccessLevel;
}
