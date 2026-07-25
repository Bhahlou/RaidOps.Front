import { SignupMode } from './signup-mode.enum';
import { RaidEventStatus } from './raid-event-status.enum';
import { RaidPublicationStatus } from './raid-publication-status.enum';
import { RaidZoneSummary } from './raid-zone.model';
import { RaidSlotAssignment } from './raid-slot-assignment.model';
import { CharacterSpec } from '../../characters/models/character-spec.model';
import { CharacterRank } from './character-rank.enum';

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
}

/** Response of the raid board query — every event materialized/created within the requested range. */
export interface RaidBoard {
  events: RaidEvent[];
}

/** Payload shared by ad-hoc raid event creation and full replacement (PATCH). */
export interface RaidEventPayload {
  name: string;
  branchId: number;
  startsAtUtc: string;
  groupCount: number;
  slotsPerGroup: number;
  signupMode: SignupMode;
  raidZoneIds: number[];
}

/** A guild member not assigned to any raid event within the requested date range. */
export interface UnassignedMember {
  characterId: number;
  characterName: string;
  classId: number;
  className: string;
  classColor: string;
  branchId: number;
  branchName: string;
  avatarUrl: string | null;
  playerDiscordId: string;
  playerName: string | null;
  raidSpecs: CharacterSpec[];
  characterRank: CharacterRank;
}
