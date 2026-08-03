import { ChangelogEntry, ChangelogEntryType, ChangelogEpoch, ChangelogGroup } from '../models/changelog-entry.model';
import { ManualLink } from '../../../shared/components/layout/page-header/page-header.component';

/** Every current entry is a Feature — `titleKey`/`descriptionKey` follow `changelog.entries.<key>.*`. */
export function feature(
  id: string,
  groupId: string,
  date: string,
  key: string,
  manualLink: ManualLink,
): ChangelogEntry {
  return {
    id,
    groupId,
    date: new Date(date),
    type: ChangelogEntryType.Feature,
    titleKey: `changelog.entries.${key}.title`,
    descriptionKey: `changelog.entries.${key}.description`,
    manualLink,
  };
}

/** An enhancement to an existing feature (not brand-new) — same shape as {@link feature}, still links to the manual. */
export function improvement(
  id: string,
  groupId: string,
  date: string,
  key: string,
  manualLink: ManualLink,
): ChangelogEntry {
  return {
    id,
    groupId,
    date: new Date(date),
    type: ChangelogEntryType.Improvement,
    titleKey: `changelog.entries.${key}.title`,
    descriptionKey: `changelog.entries.${key}.description`,
    manualLink,
  };
}

/** A bug fix — no manual link, `titleKey`/`descriptionKey` follow the same `changelog.entries.<key>.*` shape as {@link feature}. */
export function fix(id: string, groupId: string, date: string, key: string): ChangelogEntry {
  return {
    id,
    groupId,
    date: new Date(date),
    type: ChangelogEntryType.Fix,
    titleKey: `changelog.entries.${key}.title`,
    descriptionKey: `changelog.entries.${key}.description`,
  };
}

/**
 * Top-level eras, curated by hand — newest first. A new epoch is added when the product turns a
 * real page (e.g. the prod launch), not on any fixed cadence.
 */
export const CHANGELOG_EPOCHS: ChangelogEpoch[] = [{ id: '1', labelKey: 'changelog.epochs.foundations' }];

/**
 * Thematic bundles nested under an epoch, curated by hand — order here is the display order
 * (a curated "product tour" reading order, not chronological).
 */
export const CHANGELOG_GROUPS: ChangelogGroup[] = [
  { id: '1.1', epochId: '1', labelKey: 'changelog.groups.authentication' },
  { id: '1.2', epochId: '1', labelKey: 'changelog.groups.guildManagementPersonal' },
  { id: '1.3', epochId: '1', labelKey: 'changelog.groups.characterManagement' },
  { id: '1.4', epochId: '1', labelKey: 'changelog.groups.availabilityManagement' },
  { id: '1.5', epochId: '1', labelKey: 'changelog.groups.guildManagement' },
  { id: '1.6', epochId: '1', labelKey: 'changelog.groups.raidManagement' },
  { id: '1.7', epochId: '1', labelKey: 'changelog.groups.userExperience' },
];

/** Newest first. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  improvement('2026-08-04-changelog-rework', '1.7', '2026-08-04', 'changelogRework', {
    category: 'account',
    article: 'whats-new',
  }),
  feature('2026-08-02-raid-notifications', '1.5', '2026-08-02', 'raidNotifications', {
    category: 'guild',
    article: 'notifications',
  }),
  feature('2026-08-01-raid-builder', '1.6', '2026-08-01', 'raidBuilder', {
    category: 'guild',
    article: 'raid-builder',
  }),
  improvement('2026-07-30-branch-notifications', '1.5', '2026-07-30', 'branchNotifications', {
    category: 'guild',
    article: 'notifications',
  }),
  improvement('2026-07-29-global-calendar', '1.4', '2026-07-29', 'globalCalendar', {
    category: 'account',
    article: 'calendar',
  }),
  feature('2026-07-28-guild-branches', '1.5', '2026-07-28', 'guildBranches', {
    category: 'guild',
    article: 'branches',
  }),
  feature('2026-07-23-guild-notifications', '1.5', '2026-07-23', 'guildNotifications', {
    category: 'guild',
    article: 'notifications',
  }),
  feature('2026-07-20-calendar', '1.4', '2026-07-20', 'calendar', {
    category: 'account',
    article: 'calendar',
  }),
  improvement('2026-07-19-bnet-multi-account', '1.5', '2026-07-19', 'bnetMultiAccount', {
    category: 'getting-started',
    article: 'create-character',
  }),
  fix('2026-07-18-ui-refresh', '1.7', '2026-07-18', 'uiRefresh'),
  feature('2026-07-05-whats-new', '1.7', '2026-07-05', 'whatsNew', {
    category: 'account',
    article: 'whats-new',
  }),
  feature('2026-07-05-manual', '1.7', '2026-07-05', 'manual', {
    category: 'getting-started',
    article: 'create-character',
  }),
  feature('2026-07-03-notifications', '1.7', '2026-07-03', 'notifications', {
    category: 'account',
    article: 'notifications',
  }),
  feature('2026-07-02-roster', '1.5', '2026-07-02', 'roster', { category: 'guild', article: 'roster' }),
  feature('2026-07-01-get-started', '1.7', '2026-07-01', 'getStarted', {
    category: 'welcome',
    article: 'onboarding',
  }),
  feature('2026-06-22-audit-log', '1.5', '2026-06-22', 'auditLog', {
    category: 'guild',
    article: 'audit-log',
  }),
  feature('2026-06-21-character-management', '1.3', '2026-06-21', 'characterManagement', {
    category: 'getting-started',
    article: 'character-detail',
  }),
  feature('2026-06-04-character-import', '1.3', '2026-06-04', 'characterImport', {
    category: 'getting-started',
    article: 'create-character',
  }),
  feature('2026-05-23-guild-register', '1.2', '2026-05-23', 'guildRegister', {
    category: 'guild',
    article: 'register',
  }),
  feature('2026-05-21-guild-list', '1.2', '2026-05-21', 'guildList', {
    category: 'guild',
    article: 'guild-list',
  }),
  feature('2026-05-21-discord-auth', '1.1', '2026-05-21', 'discordAuth', {
    category: 'account',
    article: 'discord-auth',
  }),
];
