/** A seeded boss encounter within a `RaidZone` (e.g. "Hydross the Unstable" in Serpentshrine Cavern). */
export interface RaidBoss {
  id: number;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
  raidZoneId: number;
  raidZoneName: string;
  raidZoneShortCode: string;
}
