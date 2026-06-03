/** A WoW character available for import, as returned by GET /api/v1/characters/available. */
export interface AvailableCharacterDto {
  bnetCharacterId: number;
  name: string;
  realmSlug: string;
  realmName: string;
  classId: number;
  className: string;
  raceId: number;
  raceName: string;
  /** BNet API faction type string: "ALLIANCE", "HORDE", or "NEUTRAL". */
  faction: string;
  level: number;
  alreadyImported: boolean;
}

/** Payload sent to POST /api/v1/characters/import for each selected character. */
export interface CharacterToImportDto {
  bnetCharacterId: number;
  name: string;
  realmSlug: string;
  realmName: string;
  classId: number;
  raceId: number;
  faction: string;
  level: number;
}
