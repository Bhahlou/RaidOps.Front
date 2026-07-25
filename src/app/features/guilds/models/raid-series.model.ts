import { SignupMode } from './signup-mode.enum';
import { RaidZoneSummary } from './raid-zone.model';

/** A recurring raid template (e.g. "Split 1", every Tuesday 21:00) that materializes into `RaidEvent`s. */
export interface RaidSeries {
  id: number;
  name: string;
  branchId: number;
  branchName: string;
  /** Day name string as serialized by the backend's `DayOfWeek` enum, e.g. `"Tuesday"`. */
  recurrenceDayOfWeek: string;
  /** Local start time, `"HH:mm:ss"`. */
  recurrenceStartTimeLocal: string;
  /** Weeks between occurrences — `1` for weekly, `2` for bi-weekly, etc. */
  recurrenceIntervalWeeks: number;
  groupCount: number;
  slotsPerGroup: number;
  signupMode: SignupMode;
  isActive: boolean;
  /** The raid zones every materialized occurrence targets by default. */
  raidZones: RaidZoneSummary[];
}

/** Payload for creating or replacing a raid series. */
export interface RaidSeriesPayload {
  name: string;
  branchId: number;
  recurrenceDayOfWeek: string;
  recurrenceStartTimeLocal: string;
  recurrenceIntervalWeeks: number;
  groupCount: number;
  slotsPerGroup: number;
  signupMode: SignupMode;
  raidZoneIds: number[];
}
