import { SignupMode } from './signup-mode.enum';
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
   * Discord IDs of every roster player (assigned or not) whose declared availability would reject
   * an assignment to this event — lets the UI mark a drop target as blocked while a drag is still
   * in progress, before the server would reject the drop.
   */
  absentPlayerDiscordIds: string[];
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
}
