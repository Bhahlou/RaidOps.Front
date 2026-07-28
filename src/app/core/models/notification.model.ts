export enum NotificationType {
  BranchOfficerRolesNotConfigured = 'BranchOfficerRolesNotConfigured',
  GuildLanguageNotConfigured = 'GuildLanguageNotConfigured',
  AbsenceNotificationsNotConfigured = 'AbsenceNotificationsNotConfigured',
}

export interface Notification {
  type: NotificationType;
  guildId: string;
  guildName: string;
}
