/** A seeded raid instance (e.g. "Serpentshrine Cavern") — reference data, not free text. */
export interface RaidZone {
  id: number;
  name: string;
  shortCode: string;
  iconUrl: string | null;
  groupCount: number;
  slotsPerGroup: number;
  sortOrder: number;
}

/** Denormalized zone reference attached to a `RaidEvent`/`RaidSeries`'s target zones. */
export interface RaidZoneSummary {
  id: number;
  name: string;
  shortCode: string;
}
