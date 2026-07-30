export enum GuildNotificationEventType {
  AbsenceAdded = 'AbsenceAdded',
  AbsenceRemoved = 'AbsenceRemoved',
}

export interface GuildNotificationSetting {
  eventType: GuildNotificationEventType;
  enabled: boolean;
  channelId: string | null;
  /**
   * The branch this row is an explicit override for, or null when it's the guild-wide row —
   * either because guild-wide was requested, or because the requested branch has no override yet
   * and this is the inherited fallback. Only ever set by the GET response, never sent back on save.
   */
  guildBranchId?: number | null;
}
