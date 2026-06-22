import { GuildAuditAction } from './guild-audit-action.enum';
import { GuildAuditCategory } from './guild-audit-category.enum';

/** A single entry of a guild's audit log. */
export interface AuditLogEntry {
  id: number;
  actorDiscordId: string;
  actorUsername: string | null;
  actorAvatarHash: string | null;
  actionType: GuildAuditAction;
  category: GuildAuditCategory;
  variables: Record<string, string> | null;
  occurredAt: string;
}
