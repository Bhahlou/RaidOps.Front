import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { RaidSpecRef } from './raid-spec-ref.model';
import { SignupStatus } from './signup-status.enum';

/** A single character assigned to a group/slot coordinate of a `RaidEvent`. */
export interface RaidSlotAssignment {
  groupNumber: number;
  slotNumber: number;
  characterId: number;
  characterName: string;
  classId: number;
  /** Hex color of the character's class, prefixed with `#`. */
  classColor: string;
  playerDiscordId: string;
  /** `null` if the player's Discord display name couldn't be resolved. */
  playerName: string | null;
  /**
   * The assigned player's resolved availability on the event's guild-local date, computed at
   * read time so a declaration made after assignment still surfaces as a conflict in the UI.
   */
  availabilityStatus: DayAvailabilityStatus;
  /** The assigned player's current response, only populated for Signup-mode events (always `null` for `DefaultPresent` events). */
  signupStatus: SignupStatus | null;
  /** The spec this character is playing for this assignment — defaults to their main raid spec when first assigned. */
  spec: RaidSpecRef;
  /** Every raid spec this character has declared — lets the UI offer switching to any of them, not just the current one. */
  availableSpecs: RaidSpecRef[];
}
