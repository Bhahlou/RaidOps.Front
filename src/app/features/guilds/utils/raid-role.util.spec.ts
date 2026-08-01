import { DayAvailabilityStatus } from '../../calendar/models/day-availability-status.enum';
import { RaidSlotAssignment } from '../models/raid-slot-assignment.model';
import { countRaidRoles, raidRoleForSpec } from './raid-role.util';

const assignment = (specId: number, overrides?: Partial<RaidSlotAssignment>): RaidSlotAssignment => ({
  groupNumber: 1,
  slotNumber: 1,
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  classColor: '#c79c6e',
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  availabilityStatus: DayAvailabilityStatus.Available,
  spec: { id: specId, name: 'spec', iconUrl: null },
  availableSpecs: [],
  ...overrides,
});

describe('raidRoleForSpec', () => {
  it('classifies a known tank spec', () => {
    expect(raidRoleForSpec(73)).toBe('tank'); // Warrior Protection
  });

  it('classifies a known healer spec', () => {
    expect(raidRoleForSpec(65)).toBe('heal'); // Paladin Holy
  });

  it('classifies a known melee spec', () => {
    expect(raidRoleForSpec(260)).toBe('melee'); // Rogue Combat
  });

  it('classifies a known ranged spec', () => {
    expect(raidRoleForSpec(63)).toBe('ranged'); // Mage Fire
  });

  it('returns null for an unclassified spec id', () => {
    expect(raidRoleForSpec(999999)).toBeNull();
  });
});

describe('countRaidRoles', () => {
  it('returns zero counts for every role when there are no assignments', () => {
    expect(countRaidRoles([])).toEqual({ tank: 0, heal: 0, melee: 0, ranged: 0 });
  });

  it('tallies assignments per role', () => {
    const assignments = [
      assignment(73), // tank
      assignment(66), // tank
      assignment(65), // heal
      assignment(260), // melee
      assignment(63), // ranged
    ];

    expect(countRaidRoles(assignments)).toEqual({ tank: 2, heal: 1, melee: 1, ranged: 1 });
  });

  it('skips an assignment whose spec cannot be classified', () => {
    const assignments = [assignment(999999), assignment(73)];

    expect(countRaidRoles(assignments)).toEqual({ tank: 1, heal: 0, melee: 0, ranged: 0 });
  });
});
