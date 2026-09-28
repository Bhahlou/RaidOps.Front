import { RaidBuffDefinition } from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../shared/models/raid-buff-scope.enum';
import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';

/** One spell of an effect, and whether the composition provides it. */
export interface RaidBuffCoverageIcon {
  definition: RaidBuffDefinition;
  provided: boolean;
}

/**
 * One effect the composition may cover. Definitions sharing an exclusive group are alternatives for
 * the same effect and fold into one entry (several icons); the entry is covered when any of them is provided.
 */
export interface RaidBuffCoverageEntry {
  key: string;
  /** The first definition of the entry — its label names the whole effect. */
  definition: RaidBuffDefinition;
  icons: RaidBuffCoverageIcon[];
  covered: boolean;
}

/** Definitions sharing a capacity pool: each provider covers only one of them, so `covered` out of `total`. */
export interface RaidBuffCoveragePool {
  key: string;
  covered: number;
  total: number;
  entries: RaidBuffCoverageEntry[];
}

export type RaidBuffCoverageItem = { kind: 'entry'; entry: RaidBuffCoverageEntry } | { kind: 'pool'; pool: RaidBuffCoveragePool };

/** What a composition brings, ready to display. */
export interface RaidBuffCoverage {
  /** Raid-wide buffs. */
  buffs: RaidBuffCoverageItem[];
  /** Raid-wide debuffs on the boss. */
  debuffs: RaidBuffCoverageItem[];
  /** Effects cast on a single chosen target. */
  individual: RaidBuffCoverageItem[];
  /** Per group number, the group buffs its own members provide — one definition per non-stacking effect. */
  groups: ReadonlyMap<number, RaidBuffDefinition[]>;
}

/** A slot provides a definition when its class matches a source and the source is any-spec or names the slot's spec. */
function slotProvides(definition: RaidBuffDefinition, slot: RaidCompositionPreviewSlot): boolean {
  return (
    slot.wowClassId !== null &&
    definition.sources.some((s) => s.classId === slot.wowClassId && (s.specId === null || s.specId === slot.specId))
  );
}

/**
 * IDs of the definitions the `slots` provide. Definitions of a capacity pool are handled in sort order
 * and each consumes one provider (a paladin casts one blessing per target), so N providers cover the
 * first N pool members. Assignment is greedy: fine while pool members share the same sources.
 */
function resolveProvided(definitions: RaidBuffDefinition[], slots: RaidCompositionPreviewSlot[]): Set<number> {
  const provided = new Set<number>();
  const usedProvidersByPool = new Map<string, Set<RaidCompositionPreviewSlot>>();

  for (const definition of definitions) {
    const matching = slots.filter((slot) => slotProvides(definition, slot));

    if (!definition.capacityPoolKey) {
      if (matching.length > 0) provided.add(definition.id);
      continue;
    }

    const used = usedProvidersByPool.get(definition.capacityPoolKey) ?? new Set<RaidCompositionPreviewSlot>();
    const freeProvider = matching.find((slot) => !used.has(slot));
    if (freeProvider) {
      used.add(freeProvider);
      provided.add(definition.id);
    }
    usedProvidersByPool.set(definition.capacityPoolKey, used);
  }

  return provided;
}

function newEntry(definition: RaidBuffDefinition, provided: boolean): RaidBuffCoverageEntry {
  return { key: `definition-${definition.id}`, definition, icons: [{ definition, provided }], covered: provided };
}

/** Folds definitions into display items: pool members into one pool, exclusive alternatives into one entry, the rest standing alone. */
function buildItems(definitions: RaidBuffDefinition[], provided: Set<number>): RaidBuffCoverageItem[] {
  const items: RaidBuffCoverageItem[] = [];
  const poolsByKey = new Map<string, RaidBuffCoveragePool>();
  const entriesByExclusiveKey = new Map<string, RaidBuffCoverageEntry>();

  for (const definition of definitions) {
    const isProvided = provided.has(definition.id);

    if (definition.capacityPoolKey) {
      let pool = poolsByKey.get(definition.capacityPoolKey);
      if (!pool) {
        pool = { key: definition.capacityPoolKey, covered: 0, total: 0, entries: [] };
        poolsByKey.set(pool.key, pool);
        items.push({ kind: 'pool', pool });
      }
      pool.total++;
      if (isProvided) pool.covered++;
      pool.entries.push(newEntry(definition, isProvided));
      continue;
    }

    const existing = definition.exclusiveGroupKey ? entriesByExclusiveKey.get(definition.exclusiveGroupKey) : undefined;
    if (existing) {
      existing.icons.push({ definition, provided: isProvided });
      existing.covered = existing.covered || isProvided;
      continue;
    }

    const entry = newEntry(definition, isProvided);
    if (definition.exclusiveGroupKey) entriesByExclusiveKey.set(definition.exclusiveGroupKey, entry);
    items.push({ kind: 'entry', entry });
  }

  return items;
}

/** The group buffs a party provides, keeping only the first provided definition of each non-stacking effect. */
function groupBuffsProvidedBy(groupDefinitions: RaidBuffDefinition[], groupSlots: RaidCompositionPreviewSlot[]): RaidBuffDefinition[] {
  const provided = resolveProvided(groupDefinitions, groupSlots);
  const seenExclusiveKeys = new Set<string>();

  return groupDefinitions.filter((definition) => {
    if (!provided.has(definition.id)) return false;
    if (!definition.exclusiveGroupKey) return true;
    if (seenExclusiveKeys.has(definition.exclusiveGroupKey)) return false;
    seenExclusiveKeys.add(definition.exclusiveGroupKey);
    return true;
  });
}

/**
 * Checks a composition's slots against the curated buff/debuff definitions of its expansion.
 * Raid-scope and individual definitions are checked against every slot, group-scope ones against each
 * group's own five slots. Definitions are processed in sort order, which also sets pool priority.
 */
export function evaluateRaidBuffCoverage(
  definitions: RaidBuffDefinition[],
  slots: RaidCompositionPreviewSlot[],
  groupCount: number,
): RaidBuffCoverage {
  const sorted = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const raidBuffs = sorted.filter((d) => d.scope === RaidBuffScope.Raid && d.kind === RaidBuffKind.Buff);
  const raidDebuffs = sorted.filter((d) => d.scope === RaidBuffScope.Raid && d.kind === RaidBuffKind.Debuff);
  const individual = sorted.filter((d) => d.scope === RaidBuffScope.Individual);
  const groupDefinitions = sorted.filter((d) => d.scope === RaidBuffScope.Group);

  const groups = new Map<number, RaidBuffDefinition[]>();
  for (let groupNumber = 1; groupNumber <= groupCount; groupNumber++) {
    const groupSlots = slots.filter((s) => s.groupNumber === groupNumber);
    groups.set(groupNumber, groupBuffsProvidedBy(groupDefinitions, groupSlots));
  }

  return {
    buffs: buildItems(raidBuffs, resolveProvided(raidBuffs, slots)),
    debuffs: buildItems(raidDebuffs, resolveProvided(raidDebuffs, slots)),
    individual: buildItems(individual, resolveProvided(individual, slots)),
    groups,
  };
}
