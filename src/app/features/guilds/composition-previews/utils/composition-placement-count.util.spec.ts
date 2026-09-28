import { countPlacements } from './composition-placement-count.util';
import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';

const slot = (overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: 1,
  wowClassName: 'Warrior',
  wowClassColor: '#C79C6E',
  specId: 71,
  specName: 'Arms',
  specIconUrl: null,
  note: null,
  ...overrides,
});

describe('countPlacements', () => {
  it('returns empty maps for no slots', () => {
    const counts = countPlacements([]);

    expect(counts.classCounts.size).toBe(0);
    expect(counts.specCounts.size).toBe(0);
  });

  it('tallies one filled slot', () => {
    const counts = countPlacements([slot({ wowClassId: 1, specId: 71 })]);

    expect(counts.classCounts.get(1)).toBe(1);
    expect(counts.specCounts.get(71)).toBe(1);
  });

  it('accumulates several slots of the same class/spec', () => {
    const counts = countPlacements([slot({ wowClassId: 1, specId: 71 }), slot({ wowClassId: 1, specId: 71, slotNumber: 2 })]);

    expect(counts.classCounts.get(1)).toBe(2);
    expect(counts.specCounts.get(71)).toBe(2);
  });

  it('tallies different classes/specs separately', () => {
    const counts = countPlacements([slot({ wowClassId: 1, specId: 71 }), slot({ wowClassId: 2, specId: 65, slotNumber: 2 })]);

    expect(counts.classCounts.get(1)).toBe(1);
    expect(counts.classCounts.get(2)).toBe(1);
    expect(counts.specCounts.get(71)).toBe(1);
    expect(counts.specCounts.get(65)).toBe(1);
  });

  it('a slot with a class but no spec counts only toward the class', () => {
    const counts = countPlacements([slot({ wowClassId: 1, specId: null })]);

    expect(counts.classCounts.get(1)).toBe(1);
    expect(counts.specCounts.size).toBe(0);
  });

  it('ignores an empty slot (no class, no spec)', () => {
    const counts = countPlacements([slot({ wowClassId: null, specId: null })]);

    expect(counts.classCounts.size).toBe(0);
    expect(counts.specCounts.size).toBe(0);
  });
});
