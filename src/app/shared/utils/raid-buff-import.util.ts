import { RaidBuffDefinitionInput, RaidBuffExportFile, RaidBuffSource } from '../models/raid-buff-definition.model';
import { RaidBuffKind, RAID_BUFF_KIND_ORDER } from '../models/raid-buff-kind.enum';
import { RaidBuffScope, RAID_BUFF_SCOPE_ORDER } from '../models/raid-buff-scope.enum';

/** Largest pasted export accepted, in characters — far above a real list, well below anything worth parsing. */
export const MAX_IMPORT_CHARS = 262_144;

/** Most definitions one import may carry. Mirrors the back-end's limit, which stays the authority. */
export const MAX_IMPORT_DEFINITIONS = 500;

const MAX_SOURCES = 20;
const MAX_LABEL_LENGTH = 128;
const MAX_KEY_LENGTH = 64;
const MAX_SORT_ORDER = 1_000_000;
const KEY_PATTERN = /^[a-z0-9-]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/** Why a pasted export was refused — the suffix of an `admin.raidBuffs.importDialog.errors.*` i18n key. */
export type RaidBuffImportError = 'tooLarge' | 'invalidJson' | 'invalidShape';

export type RaidBuffImportParseResult = { ok: true; file: RaidBuffExportFile } | { ok: false; error: RaidBuffImportError };

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const label = value.trim();
  return label.length > 0 && label.length <= MAX_LABEL_LENGTH && !CONTROL_CHARACTERS.test(label) ? label : null;
}

/** `undefined` = invalid, `null` = absent (blank or null), otherwise the normalized key. */
function cleanKey(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;

  const key = value.trim().toLowerCase();
  if (key.length === 0) return null;
  return key.length <= MAX_KEY_LENGTH && KEY_PATTERN.test(key) ? key : undefined;
}

function cleanSource(value: unknown): RaidBuffSource | null {
  if (!isRecord(value) || !isPositiveInt(value['classId'])) return null;

  const specId = value['specId'] ?? null;
  if (specId !== null && !isPositiveInt(specId)) return null;

  return { classId: value['classId'], specId };
}

function cleanSources(value: unknown): RaidBuffSource[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_SOURCES) return null;

  const sources = value.map(cleanSource);
  return sources.every((s): s is RaidBuffSource => s !== null) ? sources : null;
}

function cleanDefinition(value: unknown): RaidBuffDefinitionInput | null {
  if (!isRecord(value)) return null;

  const labelEn = cleanLabel(value['labelEn']);
  const labelFr = cleanLabel(value['labelFr']);
  const labelDe = cleanLabel(value['labelDe']);
  const exclusiveGroupKey = cleanKey(value['exclusiveGroupKey']);
  const capacityPoolKey = cleanKey(value['capacityPoolKey']);
  const sources = cleanSources(value['sources']);
  const sortOrder = value['sortOrder'];

  const valid =
    isPositiveInt(value['spellId']) &&
    RAID_BUFF_SCOPE_ORDER.includes(value['scope'] as RaidBuffScope) &&
    RAID_BUFF_KIND_ORDER.includes(value['kind'] as RaidBuffKind) &&
    labelEn !== null &&
    labelFr !== null &&
    labelDe !== null &&
    exclusiveGroupKey !== undefined &&
    capacityPoolKey !== undefined &&
    sources !== null &&
    typeof sortOrder === 'number' &&
    Number.isInteger(sortOrder) &&
    Math.abs(sortOrder) <= MAX_SORT_ORDER;

  if (!valid) return null;

  // Rebuilt field by field: anything the file carries beyond the known fields never reaches the server.
  return {
    spellId: value['spellId'] as number,
    scope: value['scope'] as RaidBuffScope,
    kind: value['kind'] as RaidBuffKind,
    labelEn,
    labelFr,
    labelDe,
    exclusiveGroupKey,
    capacityPoolKey,
    sortOrder,
    sources,
  };
}

/**
 * Parses and strictly validates the JSON produced by the admin export. Nothing is trusted: the size is
 * capped, every field is type- and range-checked, labels may not carry control characters, keys are
 * limited to lowercase letters, digits and hyphens, and the result is rebuilt from the known fields
 * only. The server validates all of this again — this just gives an early, readable refusal.
 */
export function parseRaidBuffExport(text: string): RaidBuffImportParseResult {
  if (text.length > MAX_IMPORT_CHARS) return { ok: false, error: 'tooLarge' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalidJson' };
  }

  if (!isRecord(parsed) || !isPositiveInt(parsed['expansionId']) || !Array.isArray(parsed['definitions'])) {
    return { ok: false, error: 'invalidShape' };
  }

  if (parsed['definitions'].length === 0 || parsed['definitions'].length > MAX_IMPORT_DEFINITIONS) {
    return { ok: false, error: 'invalidShape' };
  }

  const definitions = parsed['definitions'].map(cleanDefinition);
  if (!definitions.every((d): d is RaidBuffDefinitionInput => d !== null)) return { ok: false, error: 'invalidShape' };

  return { ok: true, file: { expansionId: parsed['expansionId'], definitions } };
}
