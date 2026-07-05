import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

export interface ManualArticle {
  id: string;
  labelKey: string;
  /** Whether the described feature requires being logged into RaidOps at all — independent of any guild. */
  requiresAuth?: boolean;
  /** Access level a guild feature described by this article requires — informational only, doesn't gate the article itself. */
  requiredAccessLevel?: GuildAccessLevel;
  contentPath(lang: string): string;
}

export interface ManualCategory {
  id: string;
  labelKey: string;
  icon: string;
  articles: ManualArticle[];
}
