export enum GuildNotificationEventType {
  AbsenceAdded = 'AbsenceAdded',
  AbsenceRemoved = 'AbsenceRemoved',
}

export interface GuildNotificationSetting {
  eventType: GuildNotificationEventType;
  enabled: boolean;
  channelId: string | null;
}
