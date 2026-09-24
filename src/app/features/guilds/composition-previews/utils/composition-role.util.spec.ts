import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';
import { countPreviewRoles } from './composition-role.util';

const slot = (specId: number | null, overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: null,
  wowClassName: null,
  wowClassColor: null,
  specId,
  specName: null,
  specIconUrl: null,
  note: null,
  ...overrides,
});

describe('countPreviewRoles', () => {
  it('returns zero counts for every role when there are no slots', () => {
    expect(countPreviewRoles([])).toEqual({ tank: 0, heal: 0, melee: 0, ranged: 0 });
  });

  it('skips a slot with no spec placeholder', () => {
    expect(countPreviewRoles([slot(null)])).toEqual({ tank: 0, heal: 0, melee: 0, ranged: 0 });
  });

  it('tallies slots per role', () => {
    const slots = [
      slot(73), // Warrior Protection — tank
      slot(66), // Paladin Protection — tank
      slot(65), // Paladin Holy — heal
      slot(260), // Rogue Combat — melee
      slot(63), // Mage Fire — ranged
    ];

    expect(countPreviewRoles(slots)).toEqual({ tank: 2, heal: 1, melee: 1, ranged: 1 });
  });

  it('skips a slot whose spec cannot be classified', () => {
    expect(countPreviewRoles([slot(999999), slot(73)])).toEqual({ tank: 1, heal: 0, melee: 0, ranged: 0 });
  });
});
