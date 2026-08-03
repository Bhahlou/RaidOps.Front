export enum NotificationType {
  BranchOfficerRolesNotConfigured = 'BranchOfficerRolesNotConfigured',
  GuildLanguageNotConfigured = 'GuildLanguageNotConfigured',
  AbsenceNotificationsNotConfigured = 'AbsenceNotificationsNotConfigured',
  BranchRegionNotConfigured = 'BranchRegionNotConfigured',
  RaidNotificationsNotConfigured = 'RaidNotificationsNotConfigured',
  RaidCompositionNotificationsNotConfigured = 'RaidCompositionNotificationsNotConfigured',
}

export interface Notification {
  type: NotificationType;
  guildId: string;
  guildName: string;
}
