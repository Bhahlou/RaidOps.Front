export enum NotificationType {
  OfficerThresholdNotConfigured = 'OfficerThresholdNotConfigured',
  GuildLanguageNotConfigured = 'GuildLanguageNotConfigured',
  AbsenceNotificationsNotConfigured = 'AbsenceNotificationsNotConfigured',
}

export interface Notification {
  type: NotificationType;
  guildId: string;
  guildName: string;
}
