/** A character that is eligible to join a specific guild. */
export interface EligibleCharacter {
  id: number;
  name: string;
  classId: number;
  className: string;
  classColor: string;
}

/** A registered guild and the subset of the user's characters eligible to join it. */
export interface GuildEligibility {
  guildId: string;
  guildName: string;
  guildIconHash: string | null;
  eligibleCharacters: EligibleCharacter[];
}
