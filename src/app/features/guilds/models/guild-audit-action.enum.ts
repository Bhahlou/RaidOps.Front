/** Category of action recorded in a guild's audit log. */
export enum GuildAuditAction {
  GuildRegistered = 'GuildRegistered',
  SettingsUpdated = 'SettingsUpdated',
  MemberJoined = 'MemberJoined',
  MemberLeft = 'MemberLeft',
  MemberExcluded = 'MemberExcluded',
  MemberRankUpdated = 'MemberRankUpdated',
}
