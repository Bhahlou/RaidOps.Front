import { evaluateRaidBuffCoverage } from './raid-buff-coverage.util';
import { RaidBuffDefinition } from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../shared/models/raid-buff-scope.enum';
import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';

let nextId = 1;

const def = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: nextId++,
  expansionId: 12,
  spellId: 1000 + nextId,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: 'label',
  labelFr: 'label',
  labelDe: 'label',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 0,
  sources: [{ classId: 7, specId: 264 }],
  spell: null,
  ...overrides,
});

const slot = (overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: 7,
  wowClassName: 'Shaman',
  wowClassColor: '#0070DE',
  specId: 264,
  specName: 'Restoration',
  specIconUrl: null,
  note: null,
  ...overrides,
});

beforeEach(() => {
  nextId = 1;
});

describe('evaluateRaidBuffCoverage', () => {
  it('returns empty sections and an empty groups map for no definitions and no groups', () => {
    const coverage = evaluateRaidBuffCoverage([], [], 0);

    expect(coverage).toEqual({ buffs: [], debuffs: [], individual: [], groups: new Map() });
  });

  it('sorts definitions into buffs/debuffs/individual/group by scope and kind', () => {
    const raidBuff = def({ scope: RaidBuffScope.Raid, kind: RaidBuffKind.Buff });
    const raidDebuff = def({ scope: RaidBuffScope.Raid, kind: RaidBuffKind.Debuff });
    const individual = def({ scope: RaidBuffScope.Individual, kind: RaidBuffKind.Buff });
    const group = def({ scope: RaidBuffScope.Group, kind: RaidBuffKind.Buff });

    const coverage = evaluateRaidBuffCoverage([raidBuff, raidDebuff, individual, group], [], 1);

    expect(coverage.buffs).toHaveLength(1);
    expect(coverage.debuffs).toHaveLength(1);
    expect(coverage.individual).toHaveLength(1);
    expect(coverage.groups.get(1)).toEqual([]); // not provided, since there are no matching slots
  });

  // ── coverage: provided vs missing ─────────────────────────────────────────

  it('marks a definition covered when a slot matches its class and spec', () => {
    const definition = def({ sources: [{ classId: 7, specId: 264 }] });

    const coverage = evaluateRaidBuffCoverage([definition], [slot({ wowClassId: 7, specId: 264 })], 0);

    const entry = coverage.buffs[0];
    expect(entry.kind).toBe('entry');
    if (entry.kind === 'entry') expect(entry.entry.covered).toBe(true);
  });

  it('marks a definition missing when no slot matches', () => {
    const definition = def({ sources: [{ classId: 7, specId: 264 }] });

    const coverage = evaluateRaidBuffCoverage([definition], [slot({ wowClassId: 1, specId: 71 })], 0);

    const entry = coverage.buffs[0];
    if (entry.kind === 'entry') expect(entry.entry.covered).toBe(false);
  });

  it('a source with no spec (any-spec) matches a slot of the class regardless of its spec', () => {
    const definition = def({ sources: [{ classId: 7, specId: null }] });

    const coverage = evaluateRaidBuffCoverage([definition], [slot({ wowClassId: 7, specId: 262 })], 0);

    const entry = coverage.buffs[0];
    if (entry.kind === 'entry') expect(entry.entry.covered).toBe(true);
  });

  it('a slot with no class never provides anything', () => {
    const definition = def({ sources: [{ classId: 7, specId: null }] });

    const coverage = evaluateRaidBuffCoverage([definition], [slot({ wowClassId: null, specId: null })], 0);

    const entry = coverage.buffs[0];
    if (entry.kind === 'entry') expect(entry.entry.covered).toBe(false);
  });

  // ── exclusive group ──────────────────────────────────────────────────────

  it('folds definitions sharing an exclusive group into one entry with several icons', () => {
    const a = def({ exclusiveGroupKey: 'armor-pct', sources: [{ classId: 7, specId: 264 }] });
    const b = def({ exclusiveGroupKey: 'armor-pct', sources: [{ classId: 5, specId: 257 }] });

    const coverage = evaluateRaidBuffCoverage([a, b], [], 0);

    expect(coverage.buffs).toHaveLength(1);
    const entry = coverage.buffs[0];
    if (entry.kind === 'entry') expect(entry.entry.icons).toHaveLength(2);
  });

  it('an exclusive-group entry is covered when at least one of its alternatives is provided', () => {
    const a = def({ exclusiveGroupKey: 'armor-pct', sources: [{ classId: 7, specId: 264 }] });
    const b = def({ exclusiveGroupKey: 'armor-pct', sources: [{ classId: 5, specId: 257 }] });

    const coverage = evaluateRaidBuffCoverage([a, b], [slot({ wowClassId: 5, specId: 257 })], 0);

    const entry = coverage.buffs[0];
    if (entry.kind === 'entry') {
      expect(entry.entry.covered).toBe(true);
      expect(entry.entry.icons.find((i) => i.definition.id === a.id)?.provided).toBe(false);
      expect(entry.entry.icons.find((i) => i.definition.id === b.id)?.provided).toBe(true);
    }
  });

  // ── capacity pool ────────────────────────────────────────────────────────

  it('folds definitions sharing a capacity pool key into one pool item', () => {
    const a = def({ capacityPoolKey: 'paladin-blessings' });
    const b = def({ capacityPoolKey: 'paladin-blessings' });

    const coverage = evaluateRaidBuffCoverage([a, b], [], 0);

    expect(coverage.buffs).toHaveLength(1);
    expect(coverage.buffs[0].kind).toBe('pool');
  });

  it('covers one pool member per matching provider, in sort order, up to the number of providers', () => {
    const a = def({ capacityPoolKey: 'paladin-blessings', sortOrder: 1, sources: [{ classId: 2, specId: null }] });
    const b = def({ capacityPoolKey: 'paladin-blessings', sortOrder: 2, sources: [{ classId: 2, specId: null }] });
    const c = def({ capacityPoolKey: 'paladin-blessings', sortOrder: 3, sources: [{ classId: 2, specId: null }] });
    const twoPaladins = [slot({ wowClassId: 2, specId: null, slotNumber: 1 }), slot({ wowClassId: 2, specId: null, slotNumber: 2 })];

    const coverage = evaluateRaidBuffCoverage([c, a, b], twoPaladins, 0);

    const pool = coverage.buffs[0];
    if (pool.kind === 'pool') {
      expect(pool.pool.total).toBe(3);
      expect(pool.pool.covered).toBe(2);
      expect(pool.pool.entries.map((e) => e.definition.id)).toEqual([a.id, b.id, c.id]); // sort order
      expect(pool.pool.entries[0].covered).toBe(true);
      expect(pool.pool.entries[1].covered).toBe(true);
      expect(pool.pool.entries[2].covered).toBe(false);
    }
  });

  it('a single provider only covers one pool member even if it matches several', () => {
    const a = def({ capacityPoolKey: 'paladin-blessings', sortOrder: 1, sources: [{ classId: 2, specId: null }] });
    const b = def({ capacityPoolKey: 'paladin-blessings', sortOrder: 2, sources: [{ classId: 2, specId: null }] });

    const coverage = evaluateRaidBuffCoverage([a, b], [slot({ wowClassId: 2, specId: null })], 0);

    const pool = coverage.buffs[0];
    if (pool.kind === 'pool') expect(pool.pool.covered).toBe(1);
  });

  // ── groups ───────────────────────────────────────────────────────────────

  it('checks group-scope definitions against only that group\'s own slots', () => {
    const definition = def({ scope: RaidBuffScope.Group, sources: [{ classId: 7, specId: 264 }] });
    const slots = [slot({ groupNumber: 1, wowClassId: 7, specId: 264 }), slot({ groupNumber: 2, wowClassId: 1, specId: 71 })];

    const coverage = evaluateRaidBuffCoverage([definition], slots, 2);

    expect(coverage.groups.get(1)).toEqual([definition]);
    expect(coverage.groups.get(2)).toEqual([]);
  });

  it('a group-scope exclusive-group effect appears at most once per group even if both alternatives are present', () => {
    const a = def({ scope: RaidBuffScope.Group, exclusiveGroupKey: 'crit-aura', sources: [{ classId: 11, specId: 102 }] });
    const b = def({ scope: RaidBuffScope.Group, exclusiveGroupKey: 'crit-aura', sources: [{ classId: 11, specId: 103 }] });
    const slots = [slot({ groupNumber: 1, wowClassId: 11, specId: 102 }), slot({ groupNumber: 1, wowClassId: 11, specId: 103, slotNumber: 2 })];

    const coverage = evaluateRaidBuffCoverage([a, b], slots, 1);

    expect(coverage.groups.get(1)).toHaveLength(1);
  });

  it('creates an entry for every group up to groupCount, even ones with no slots', () => {
    const coverage = evaluateRaidBuffCoverage([], [], 3);

    expect([...coverage.groups.keys()]).toEqual([1, 2, 3]);
  });

  // ── ordering ─────────────────────────────────────────────────────────────

  it('processes definitions in sortOrder, then by id as a tiebreaker', () => {
    const second = def({ sortOrder: 2 });
    const first = def({ sortOrder: 1 });

    const coverage = evaluateRaidBuffCoverage([second, first], [], 0);

    expect(coverage.buffs.map((item) => (item.kind === 'entry' ? item.entry.definition.id : null))).toEqual([first.id, second.id]);
  });
});
