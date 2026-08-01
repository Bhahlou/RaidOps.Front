import { RaidSlotAssignment } from '../models/raid-slot-assignment.model';

export type RaidRole = 'tank' | 'heal' | 'melee' | 'ranged';

/**
 * Tank/heal specs map 1:1 to the back end's `SpecRole.Tank`/`Healer`; the melee/ranged split
 * further breaks down `SpecRole.Dps` for the header's role counter — a distinction the domain
 * itself has no notion of, since it never affects assignment/lockout rules. Keyed by Blizzard's
 * spec ID (stable across every expansion), and static: which specs deal melee vs ranged damage
 * hasn't changed retroactively even across reworks (e.g. Survival Hunter → melee in Legion is
 * the current, permanent classification).
 */
const RAID_ROLE_BY_SPEC_ID: Record<number, RaidRole> = {
  // Death Knight
  250: 'tank',
  251: 'melee',
  252: 'melee',
  // Demon Hunter
  577: 'melee',
  581: 'tank',
  // Druid
  102: 'ranged',
  103: 'melee',
  104: 'tank',
  105: 'heal',
  // Evoker
  1473: 'ranged',
  1467: 'ranged',
  1468: 'heal',
  // Hunter
  253: 'ranged',
  254: 'ranged',
  255: 'melee',
  // Mage
  62: 'ranged',
  63: 'ranged',
  64: 'ranged',
  // Monk
  268: 'tank',
  270: 'heal',
  269: 'melee',
  // Paladin
  65: 'heal',
  66: 'tank',
  70: 'melee',
  // Priest
  256: 'heal',
  257: 'heal',
  258: 'ranged',
  // Rogue
  259: 'melee',
  260: 'melee',
  261: 'melee',
  // Shaman
  262: 'ranged',
  263: 'melee',
  264: 'heal',
  // Warlock
  265: 'ranged',
  266: 'ranged',
  267: 'ranged',
  // Warrior
  71: 'melee',
  72: 'melee',
  73: 'tank',
};

/** `null` for an unclassified spec ID (should not happen for any seeded spec). */
export function raidRoleForSpec(specId: number): RaidRole | null {
  return RAID_ROLE_BY_SPEC_ID[specId] ?? null;
}

/** Display order for the event header's role counter. */
export const RAID_ROLE_ORDER: RaidRole[] = ['tank', 'heal', 'melee', 'ranged'];

/** Icon asset path (see `public/assets/images/role-icons`) for each role's counter badge. */
export const RAID_ROLE_ICON: Record<RaidRole, string> = {
  tank: 'assets/images/role-icons/tank.svg',
  heal: 'assets/images/role-icons/healer.svg',
  melee: 'assets/images/role-icons/mdps.svg',
  ranged: 'assets/images/role-icons/rdps.svg',
};

/** Tally of assigned characters per raid role, for the event header's role counter. */
export function countRaidRoles(assignments: RaidSlotAssignment[]): Record<RaidRole, number> {
  const counts: Record<RaidRole, number> = { tank: 0, heal: 0, melee: 0, ranged: 0 };
  for (const a of assignments) {
    const role = raidRoleForSpec(a.spec.id);
    if (role) counts[role]++;
  }
  return counts;
}
