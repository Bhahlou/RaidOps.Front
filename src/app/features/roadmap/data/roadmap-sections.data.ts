import { RoadmapItem, RoadmapItemStatus, RoadmapSection } from '../models/roadmap-section.model';

export function item(key: string, status: RoadmapItemStatus = RoadmapItemStatus.Planned): RoadmapItem {
  return {
    id: key,
    titleKey: `roadmap.items.${key}.title`,
    descriptionKey: `roadmap.items.${key}.description`,
    status,
  };
}

/** Shipped, from the changelog — kept here so the roadmap also shows how far the app has come. */
export function done(key: string): RoadmapItem {
  return item(key, RoadmapItemStatus.Done);
}

export function section(key: string, items: RoadmapItem[], inProgress = false): RoadmapSection {
  return {
    id: key,
    titleKey: `roadmap.section.${key}.title`,
    items,
    inProgress,
  };
}

/** Displayed in this order; no notion of priority or ETA, just grouped by theme. */
export const ROADMAP_SECTIONS: RoadmapSection[] = [
  section(
    'foundations',
    [
      done('discordAuth'),
      done('characterImport'),
      done('characterManagement'),
      done('guildRegister'),
      done('guildList'),
      done('roster'),
      done('auditLog'),
      done('notifications'),
      done('getStarted'),
      done('manual'),
      done('whatsNew'),
      item('guildCalendar'),
      item('raidBuilder'),
      item('raidAssignments'),
      item('raidHistory'),
      item('guildDashboard'),
    ],
    true,
  ),
  section('loot', [
    item('gearArmory'),
    item('bisLists'),
    item('lootHistoryImport'),
    item('lootAwareRaidBuilder'),
  ]),
  section('professions', [
    item('characterProfessions'),
    item('possibleCrafts'),
    item('craftRequest'),
  ]),
  section('privacy', [
    item('dataExport'),
    item('bnetAccountDeletion'),
    item('discordAccountDeletion'),
    item('characterDeletion'),
  ]),
  section('technical', [
    item('angular22Migration'),
    item('securityHardening'),
    item('responsiveness'),
    item('designPolish'),
  ]),
  section('raidLogs', [item('warcraftLogsIntegration'), item('bossPerformanceTracking')]),
];
