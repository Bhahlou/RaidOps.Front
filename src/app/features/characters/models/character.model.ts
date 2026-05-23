/** A WoW character imported into RaidOps. */
export interface CharacterDto {
  id: number;
  name: string;
  classId: number;
  className: string;
  classColor: string;
  raceId: number;
  raceName: string;
  faction: string;
  realmName: string;
  realmSlug: string;
  level: number;
  itemLevel: number | null;
}
