import { RosterMode } from './roster-mode.enum';

export interface GuildSettings {
  timezone: string;
  rosterMode: RosterMode;
  minRosterRoleId: string | null;
}
