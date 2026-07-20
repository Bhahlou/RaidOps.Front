/** Category of action recorded in a guild's audit log. */
export enum GuildAuditAction {
  GuildRegistered = 'GuildRegistered',
  SettingsUpdated = 'SettingsUpdated',
  MemberJoined = 'MemberJoined',
  MemberLeft = 'MemberLeft',
  MemberExcluded = 'MemberExcluded',
  MemberRankUpdated = 'MemberRankUpdated',
  OfficerThresholdUpdated = 'OfficerThresholdUpdated',
  AvailabilityExceptionDeclared = 'AvailabilityExceptionDeclared',
  AvailabilityExceptionDeleted = 'AvailabilityExceptionDeleted',
  RecurringAvailabilityPatternCreated = 'RecurringAvailabilityPatternCreated',
  RecurringAvailabilityPatternUpdated = 'RecurringAvailabilityPatternUpdated',
  RecurringAvailabilityPatternStopped = 'RecurringAvailabilityPatternStopped',
}
