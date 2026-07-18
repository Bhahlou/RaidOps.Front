import { ChangelogEntry, ChangelogEntryType } from '../models/changelog-entry.model';
import { ManualLink } from '../../../shared/components/layout/page-header/page-header.component';

/** Every current entry is a Feature — `titleKey`/`descriptionKey` follow `changelog.entries.<key>.*`. */
export function feature(
  id: string,
  date: string,
  key: string,
  manualLink: ManualLink,
): ChangelogEntry {
  return {
    id,
    date: new Date(date),
    type: ChangelogEntryType.Feature,
    titleKey: `changelog.entries.${key}.title`,
    descriptionKey: `changelog.entries.${key}.description`,
    manualLink,
  };
}

/** A fix or small improvement — no manual link, `titleKey`/`descriptionKey` follow the same `changelog.entries.<key>.*` shape as {@link feature}. */
export function fix(id: string, date: string, key: string): ChangelogEntry {
  return {
    id,
    date: new Date(date),
    type: ChangelogEntryType.Fix,
    titleKey: `changelog.entries.${key}.title`,
    descriptionKey: `changelog.entries.${key}.description`,
  };
}

/** Newest first. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  fix('2026-07-18-ui-refresh', '2026-07-18', 'uiRefresh'),
  feature('2026-07-05-whats-new', '2026-07-05', 'whatsNew', {
    category: 'account',
    article: 'whats-new',
  }),
  feature('2026-07-05-manual', '2026-07-05', 'manual', {
    category: 'getting-started',
    article: 'create-character',
  }),
  feature('2026-07-03-notifications', '2026-07-03', 'notifications', {
    category: 'account',
    article: 'notifications',
  }),
  feature('2026-07-02-roster', '2026-07-02', 'roster', { category: 'guild', article: 'roster' }),
  feature('2026-07-01-get-started', '2026-07-01', 'getStarted', {
    category: 'welcome',
    article: 'onboarding',
  }),
  feature('2026-06-22-audit-log', '2026-06-22', 'auditLog', {
    category: 'guild',
    article: 'audit-log',
  }),
  feature('2026-06-21-character-management', '2026-06-21', 'characterManagement', {
    category: 'getting-started',
    article: 'character-detail',
  }),
  feature('2026-06-04-character-import', '2026-06-04', 'characterImport', {
    category: 'getting-started',
    article: 'create-character',
  }),
  feature('2026-05-23-guild-register', '2026-05-23', 'guildRegister', {
    category: 'guild',
    article: 'register',
  }),
  feature('2026-05-21-guild-list', '2026-05-21', 'guildList', {
    category: 'guild',
    article: 'guild-list',
  }),
  feature('2026-05-21-discord-auth', '2026-05-21', 'discordAuth', {
    category: 'account',
    article: 'discord-auth',
  }),
];
