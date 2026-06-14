import { CharacterRank } from './character-rank.enum';

/** A guild roster membership as seen from the character's side. */
export interface GuildMembership {
  guildId: string;
  guildName: string;
  guildIconHash: string | null;
  characterRank: CharacterRank;
  joinedAt: string;
}
