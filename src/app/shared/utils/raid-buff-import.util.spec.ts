import { MAX_IMPORT_CHARS, MAX_IMPORT_DEFINITIONS, parseRaidBuffExport } from './raid-buff-import.util';
import { RaidBuffDefinitionInput, RaidBuffExportFile } from '../models/raid-buff-definition.model';

const validDefinition = (overrides?: Record<string, unknown>): Record<string, unknown> => ({
  spellId: 16176,
  scope: 'Raid',
  kind: 'Buff',
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 10,
  sources: [{ classId: 7, specId: 264 }],
  ...overrides,
});

const file = (definitions: unknown[], overrides?: Record<string, unknown>): string =>
  JSON.stringify({ expansionId: 12, definitions, ...overrides });

describe('parseRaidBuffExport', () => {
  // ── size / shape ─────────────────────────────────────────────────────────

  it('accepts a valid file', () => {
    const result = parseRaidBuffExport(file([validDefinition()]));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.expansionId).toBe(12);
      expect(result.file.definitions).toHaveLength(1);
    }
  });

  it('refuses text longer than MAX_IMPORT_CHARS', () => {
    const tooLarge = 'a'.repeat(MAX_IMPORT_CHARS + 1);

    expect(parseRaidBuffExport(tooLarge)).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('accepts text exactly at MAX_IMPORT_CHARS (still needs to be valid JSON, so this one is refused for shape instead)', () => {
    const atLimit = file([validDefinition()]).padEnd(MAX_IMPORT_CHARS, ' ');

    // Padding with spaces outside the JSON value keeps it syntactically valid JSON — proves the
    // length check itself doesn't reject at the boundary.
    expect(parseRaidBuffExport(atLimit).ok).toBe(true);
  });

  it('refuses invalid JSON', () => {
    expect(parseRaidBuffExport('not json')).toEqual({ ok: false, error: 'invalidJson' });
  });

  it('refuses a JSON array at the top level', () => {
    expect(parseRaidBuffExport('[]')).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a missing or non-positive expansionId', () => {
    expect(parseRaidBuffExport(JSON.stringify({ definitions: [validDefinition()] }))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition()], { expansionId: 0 }))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition()], { expansionId: -1 }))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition()], { expansionId: '12' }))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a missing or non-array definitions field', () => {
    expect(parseRaidBuffExport(JSON.stringify({ expansionId: 12 }))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(JSON.stringify({ expansionId: 12, definitions: 'nope' }))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses an empty definitions list', () => {
    expect(parseRaidBuffExport(file([]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses more than MAX_IMPORT_DEFINITIONS entries', () => {
    const definitions = Array.from({ length: MAX_IMPORT_DEFINITIONS + 1 }, () => validDefinition());

    expect(parseRaidBuffExport(file(definitions))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('accepts exactly MAX_IMPORT_DEFINITIONS entries', () => {
    const definitions = Array.from({ length: MAX_IMPORT_DEFINITIONS }, (_, i) => validDefinition({ spellId: i + 1 }));

    expect(parseRaidBuffExport(file(definitions)).ok).toBe(true);
  });

  // ── per-definition: spellId / scope / kind ────────────────────────────────

  it('refuses a definition that is not an object', () => {
    expect(parseRaidBuffExport(file(['nope']))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a non-positive or non-integer spellId', () => {
    expect(parseRaidBuffExport(file([validDefinition({ spellId: 0 })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ spellId: -1 })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ spellId: 1.5 })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ spellId: '16176' })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses an unknown scope or kind', () => {
    expect(parseRaidBuffExport(file([validDefinition({ scope: 'Nope' })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ kind: 'Nope' })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it.each(['Raid', 'Group', 'Individual'])('accepts every known scope (%s)', (scope) => {
    expect(parseRaidBuffExport(file([validDefinition({ scope })])).ok).toBe(true);
  });

  it.each(['Buff', 'Debuff'])('accepts every known kind (%s)', (kind) => {
    expect(parseRaidBuffExport(file([validDefinition({ kind })])).ok).toBe(true);
  });

  // ── labels ───────────────────────────────────────────────────────────────

  it.each(['labelEn', 'labelFr', 'labelDe'])('refuses a missing, blank or non-string %s', (field) => {
    expect(parseRaidBuffExport(file([validDefinition({ [field]: undefined })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ [field]: '   ' })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ [field]: 42 })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a label longer than 128 characters', () => {
    expect(parseRaidBuffExport(file([validDefinition({ labelEn: 'a'.repeat(129) })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('accepts a label at exactly 128 characters', () => {
    expect(parseRaidBuffExport(file([validDefinition({ labelEn: 'a'.repeat(128) })])).ok).toBe(true);
  });

  it('refuses a label containing a control character', () => {
    expect(parseRaidBuffExport(file([validDefinition({ labelEn: 'bad\u0007label' })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('trims label whitespace', () => {
    const result = parseRaidBuffExport(file([validDefinition({ labelEn: '  spaced  ' })]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.definitions[0].labelEn).toBe('spaced');
  });

  // ── keys ─────────────────────────────────────────────────────────────────

  it.each([null, undefined, ''])('accepts a blank/null/absent exclusiveGroupKey and capacityPoolKey (%s)', (value) => {
    expect(parseRaidBuffExport(file([validDefinition({ exclusiveGroupKey: value, capacityPoolKey: value })])).ok).toBe(true);
  });

  it('trims and lower-cases a key', () => {
    const result = parseRaidBuffExport(file([validDefinition({ exclusiveGroupKey: '  Armor-PCT  ' })]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.definitions[0].exclusiveGroupKey).toBe('armor-pct');
  });

  it('refuses a key longer than 64 characters', () => {
    expect(parseRaidBuffExport(file([validDefinition({ exclusiveGroupKey: 'a'.repeat(65) })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it.each(['armor pct', 'armor_pct', 'armor!'])('refuses a key with disallowed characters (%s)', (key) => {
    expect(parseRaidBuffExport(file([validDefinition({ capacityPoolKey: key })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a non-string key that is not null/undefined', () => {
    expect(parseRaidBuffExport(file([validDefinition({ exclusiveGroupKey: 42 })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  // ── sources ──────────────────────────────────────────────────────────────

  it('refuses an empty sources array', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sources: [] })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a non-array sources field', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sources: 'nope' })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses more than 20 sources', () => {
    const sources = Array.from({ length: 21 }, () => ({ classId: 7, specId: null }));

    expect(parseRaidBuffExport(file([validDefinition({ sources })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('accepts a source with no specId (any spec)', () => {
    const result = parseRaidBuffExport(file([validDefinition({ sources: [{ classId: 7 }] })]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.definitions[0].sources).toEqual([{ classId: 7, specId: null }]);
  });

  it('refuses a source with a non-positive classId or specId', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sources: [{ classId: 0 }] })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ sources: [{ classId: 7, specId: -1 }] })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('refuses a source that is not an object', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sources: ['nope'] })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  // ── sortOrder ────────────────────────────────────────────────────────────

  it('refuses a non-integer or out-of-range sortOrder', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: 1.5 })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: '10' })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: 1_000_001 })]))).toEqual({ ok: false, error: 'invalidShape' });
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: -1_000_001 })]))).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('accepts a negative sortOrder and the boundary values', () => {
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: -5 })])).ok).toBe(true);
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: 1_000_000 })])).ok).toBe(true);
    expect(parseRaidBuffExport(file([validDefinition({ sortOrder: -1_000_000 })])).ok).toBe(true);
  });

  // ── rebuilding (only known fields survive) ────────────────────────────────

  it('strips unknown fields — the parsed definition only ever carries the known shape', () => {
    const result = parseRaidBuffExport(file([validDefinition({ extraField: 'nope', id: 999 })]));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const definition = result.file.definitions[0] as RaidBuffDefinitionInput & Record<string, unknown>;
      expect(Object.keys(definition).sort()).toEqual(
        ['spellId', 'scope', 'kind', 'labelEn', 'labelFr', 'labelDe', 'exclusiveGroupKey', 'capacityPoolKey', 'sortOrder', 'sources'].sort(),
      );
      expect(definition['extraField']).toBeUndefined();
      expect(definition['id']).toBeUndefined();
    }
  });

  it('parses several valid definitions', () => {
    const result = parseRaidBuffExport(file([validDefinition({ spellId: 1 }), validDefinition({ spellId: 2 })]));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.definitions.map((d) => d.spellId)).toEqual([1, 2]);
  });

  it('refuses the whole file if any one definition is invalid', () => {
    const result = parseRaidBuffExport(file([validDefinition({ spellId: 1 }), validDefinition({ labelEn: '' })]));

    expect(result).toEqual({ ok: false, error: 'invalidShape' });
  });

  it('the result satisfies the RaidBuffExportFile shape', () => {
    const result = parseRaidBuffExport(file([validDefinition()]));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const asFile: RaidBuffExportFile = result.file;
      expect(asFile.expansionId).toBe(12);
    }
  });
});
