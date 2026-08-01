export enum NotificationType {
  BranchOfficerRolesNotConfigured = 'BranchOfficerRolesNotConfigured',
  GuildLanguageNotConfigured = 'GuildLanguageNotConfigured',
  AbsenceNotificationsNotConfigured = 'AbsenceNotificationsNotConfigured',
  BranchRegionNotConfigured = 'BranchRegionNotConfigured',
}

export interface Notification {
  type: NotificationType;
  guildId: string;
  guildName: string;
}
