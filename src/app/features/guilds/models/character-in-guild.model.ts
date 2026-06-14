import { CharacterRank } from './character-rank.enum';

/** One of the current user's characters on a guild roster, as seen from the guild side. */
export interface CharacterInGuild {
  characterId: number;
  name: string;
  realmName: string;
  className: string;
  classColor: string;
  avatarUrl: string | null;
  guildName: string | null;
  characterRank: CharacterRank;
  joinedAt: string;
}
