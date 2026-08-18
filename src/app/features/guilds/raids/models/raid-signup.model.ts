import { SignupStatus } from './signup-status.enum';

/** One roster member's response to a Signup-mode raid event — backs the Discord-embed-style signup list and the officer roster/status list. */
export interface RaidSignup {
  userDiscordId: string;
  playerName: string | null;
  /** `null` if the member hasn't responded yet. */
  status: SignupStatus | null;
  /** ISO datetime string, `null` if the member hasn't responded yet. */
  respondedAtUtc: string | null;
  /** The character being brought, set for Accepted and Tentative. */
  characterId: number | null;
  characterName: string | null;
  /** Blizzard class ID of `characterId`'s character, or `null` if not applicable. */
  classId: number | null;
  className: string | null;
  /** The spec being brought, set for Accepted and Tentative. */
  specId: number | null;
  specName: string | null;
  specIconUrl: string | null;
}
