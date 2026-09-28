import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';

/** How many filled slots use each class and each spec — feeds the class/spec palette's counters. */
export interface CompositionPlacementCounts {
  classCounts: ReadonlyMap<number, number>;
  specCounts: ReadonlyMap<number, number>;
}

function increment(counts: Map<number, number>, key: number): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/** Tallies how many slots are filled with each class and each spec. A slot with a class but no spec counts only toward its class. */
export function countPlacements(slots: RaidCompositionPreviewSlot[]): CompositionPlacementCounts {
  const classCounts = new Map<number, number>();
  const specCounts = new Map<number, number>();

  for (const slot of slots) {
    if (slot.wowClassId !== null) increment(classCounts, slot.wowClassId);
    if (slot.specId !== null) increment(specCounts, slot.specId);
  }

  return { classCounts, specCounts };
}
