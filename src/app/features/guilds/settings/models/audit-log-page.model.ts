import { AuditLogEntry } from './audit-log-entry.model';

/** A single page of a guild's audit log. */
export interface AuditLogPage {
  entries: AuditLogEntry[];
  hasMore: boolean;
}
