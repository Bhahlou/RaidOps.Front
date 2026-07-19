import { CharacterRank } from './character-rank.enum';
import { CharacterSpec } from '../../characters/models/character-spec.model';

/** A single character entry on a guild's roster. */
export interface GuildRosterMember {
  characterId: number;
  characterName: string;
  classId: number;
  className: string;
  classColor: string;
  level: number;
  branchName: string;
  realmSlug: string;
  avatarUrl: string | null;
  playerDiscordId: string;
  playerName: string | null;
  playerAvatarHash: string | null;
  /** User-curated raid-viable specs, main spec first. Empty if none have been curated yet. */
  raidSpecs: CharacterSpec[];
  characterRank: CharacterRank;
  joinedAt: string;
  /** Whether the current user is allowed to exclude this character from the roster. */
  canExclude: boolean;
}
