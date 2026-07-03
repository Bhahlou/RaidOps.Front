export enum NotificationType {
  OfficerThresholdNotConfigured = 'OfficerThresholdNotConfigured',
}

export interface Notification {
  type: NotificationType;
  guildId: string;
  guildName: string;
}
