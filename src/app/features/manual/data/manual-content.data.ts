import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';
import { ManualCategory } from '../models/manual-article.model';

export const MANUAL_CATEGORIES: ManualCategory[] = [
  {
    id: 'welcome',
    labelKey: 'manual.category.welcome',
    icon: 'waving_hand',
    articles: [
      {
        id: 'onboarding',
        labelKey: 'manual.article.onboarding.title',
        contentPath: (lang) => `assets/manual/${lang}/welcome/onboarding.md`,
      },
    ],
  },
  {
    id: 'account',
    labelKey: 'manual.category.account',
    icon: 'discord',
    articles: [
      {
        id: 'discord-auth',
        labelKey: 'manual.article.discordAuth.title',
        contentPath: (lang) => `assets/manual/${lang}/account/discord-auth.md`,
      },
      {
        id: 'notifications',
        labelKey: 'manual.article.notifications.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/account/notifications.md`,
      },
      {
        id: 'whats-new',
        labelKey: 'manual.article.whatsNew.title',
        contentPath: (lang) => `assets/manual/${lang}/account/whats-new.md`,
      },
      {
        id: 'calendar',
        labelKey: 'manual.article.calendar.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/account/calendar.md`,
      },
    ],
  },
  {
    id: 'getting-started',
    labelKey: 'manual.category.gettingStarted',
    icon: 'person',
    articles: [
      {
        id: 'create-character',
        labelKey: 'manual.article.createCharacter.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/characters/create-character.md`,
      },
      {
        id: 'character-detail',
        labelKey: 'manual.article.characterDetail.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/characters/character-detail.md`,
      },
    ],
  },
  {
    id: 'guild',
    labelKey: 'manual.category.guild',
    icon: 'groups',
    articles: [
      {
        id: 'register',
        labelKey: 'manual.article.register.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/guild/register.md`,
      },
      {
        id: 'guild-list',
        labelKey: 'manual.article.guildList.title',
        requiresAuth: true,
        contentPath: (lang) => `assets/manual/${lang}/guild/guild-list.md`,
      },
      {
        id: 'roster',
        labelKey: 'manual.article.roster.title',
        requiredAccessLevel: GuildAccessLevel.Roster,
        contentPath: (lang) => `assets/manual/${lang}/guild/roster.md`,
      },
      {
        id: 'audit-log',
        labelKey: 'manual.article.auditLog.title',
        requiredAccessLevel: GuildAccessLevel.Officer,
        contentPath: (lang) => `assets/manual/${lang}/guild/audit-log.md`,
      },
      {
        id: 'settings',
        labelKey: 'manual.article.settings.title',
        requiredAccessLevel: GuildAccessLevel.Officer,
        contentPath: (lang) => `assets/manual/${lang}/guild/settings.md`,
      },
      {
        id: 'branches',
        labelKey: 'manual.article.guildBranches.title',
        requiredAccessLevel: GuildAccessLevel.Officer,
        contentPath: (lang) => `assets/manual/${lang}/guild/branches.md`,
      },
      {
        id: 'notifications',
        labelKey: 'manual.article.guildNotifications.title',
        requiredAccessLevel: GuildAccessLevel.Officer,
        contentPath: (lang) => `assets/manual/${lang}/guild/notifications.md`,
      },
    ],
  },
];
