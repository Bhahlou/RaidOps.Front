import { SignupMode } from './signup-mode.enum';
import { SignupStatus } from './signup-status.enum';
import { RaidEventStatus } from './raid-event-status.enum';
import { RaidPublicationStatus } from './raid-publication-status.enum';
import { RaidZoneSummary } from './raid-zone.model';
import { RaidSlotAssignment } from './raid-slot-assignment.model';

/** A single raid occurrence — generated from a `RaidSeries` or created ad-hoc. */
export interface RaidEvent {
  id: number;
  /** `null` for an ad-hoc event not backed by any recurring series. */
  raidSeriesId: number | null;
  name: string;
  branchId: number;
  branchName: string;
  /** ISO datetime string. */
  startsAtUtc: string;
  groupCount: number;
  slotsPerGroup: number;
  signupMode: SignupMode;
  status: RaidEventStatus;
  /** Draft/published visibility, orthogonal to `status`. */
  publicationStatus: RaidPublicationStatus;
  raidZones: RaidZoneSummary[];
  assignments: RaidSlotAssignment[];
  /**
   * Discord IDs of every roster player (assigned or not) currently ineligible for assignment to
   * this event — lets the UI mark a drop target as blocked while a drag is still in progress,
   * before the server would reject the drop. For `DefaultPresent` events this is every player with
   * a declared absence covering the event; for `Signup` events it's every player without an
   * Accepted response.
   */
  ineligiblePlayerDiscordIds: string[];
  /** The requesting user's own response, or `null` if this isn't a Signup-mode event or they haven't responded yet. */
  mySignupStatus: SignupStatus | null;
  /** The character behind `mySignupStatus`, set for Accepted and Tentative. */
  mySignupCharacterId: number | null;
  /** The spec behind `mySignupStatus`, set for Accepted and Tentative. */
  mySignupSpecId: number | null;
  /**
   * For `Signup`-mode events, maps each roster player's Discord ID to the character ID they're
   * Accepted with — lets the roster pool narrow a player's candidate characters down to the one
   * they actually signed up with instead of every alt on their account. Empty for `DefaultPresent` events.
   */
  acceptedCharacterIdsByPlayerDiscordId: Record<string, number>;
  /** Discord snowflake ID of this event's dedicated announcement channel, or `null` to use the guild-wide configured one. */
  dedicatedAnnouncementChannelId: string | null;
  /** Whether `dedicatedAnnouncementChannelId` was created by RaidOps specifically for this event. */
  dedicatedAnnouncementChannelIsBotOwned: boolean;
}

/** Response of the raid board query — every event materialized/created within the requested range. */
export interface RaidBoard {
  events: RaidEvent[];
}

/** Payload shared by ad-hoc raid event creation and full replacement (PATCH) — the guild branch (and its WoW game version) is the route's `guildBranchId`, never a client-supplied field. */
export interface RaidEventPayload {
  name: string;
  startsAtUtc: string;
  groupCount: number;
  slotsPerGroup: number;
  signupMode: SignupMode;
  raidZoneIds: number[];
  /** Overrides the branch's default signup mode for this one event — creation only, `undefined` means "use the branch default." */
  signupModeOverride?: SignupMode | null;
  /** Discord snowflake ID of a dedicated channel this event's notifications should all post to instead of the guild-wide configured one — creation only. */
  dedicatedAnnouncementChannelId?: string | null;
  /** Whether `dedicatedAnnouncementChannelId` was just created by RaidOps for this event rather than an existing channel — drives whether deleting the event also deletes the channel. Creation only. */
  dedicatedAnnouncementChannelIsBotOwned?: boolean;
}
