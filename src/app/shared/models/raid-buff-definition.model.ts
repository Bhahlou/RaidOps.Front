import { RaidBuffKind } from './raid-buff-kind.enum';
import { RaidBuffScope } from './raid-buff-scope.enum';

/** One class/spec able to provide a buff or debuff; a null `specId` means any spec of the class. */
export interface RaidBuffSource {
  classId: number;
  specId: number | null;
}

/** What a definition's spell is called and looks like on the definition's expansion, in every locale. */
export interface RaidBuffSpell {
  nameEn: string;
  nameFr: string;
  nameDe: string;
  iconUrl: string;
}

/**
 * The editable fields of a raid buff/debuff definition — also the shape of the admin export/import
 * file, so it carries nothing environment-specific (spells, classes and specs are Blizzard IDs).
 */
export interface RaidBuffDefinitionInput {
  spellId: number;
  scope: RaidBuffScope;
  kind: RaidBuffKind;
  labelEn: string;
  labelFr: string;
  labelDe: string;
  /** Definitions sharing this key are non-stacking alternatives for one effect. */
  exclusiveGroupKey: string | null;
  /** Definitions sharing this key form a capacity pool: each provider covers only one of them. */
  capacityPoolKey: string | null;
  sortOrder: number;
  sources: RaidBuffSource[];
}

/** A stored definition as returned by `GET /api/v1/raidbuffs`. */
export interface RaidBuffDefinition extends RaidBuffDefinitionInput {
  id: number;
  expansionId: number;
  /** Null when the spell has no availability row on the definition's expansion. */
  spell: RaidBuffSpell | null;
}

/** What an admin save/import changed. */
export interface RaidBuffUpsertSummary {
  created: number;
  updated: number;
  deleted: number;
}

/** The JSON file written by the admin export and read by the admin import. */
export interface RaidBuffExportFile {
  expansionId: number;
  definitions: RaidBuffDefinitionInput[];
}
