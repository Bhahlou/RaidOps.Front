import { Notification } from './notification.model';
import { UserGuild } from './user-guild.model';

export interface User {
  discordId: string;
  name: string;
  avatarHash: string | null;
  guilds: UserGuild[];
  notifications: Notification[];
}
