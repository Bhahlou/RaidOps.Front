/**
 * How far a raid buff or debuff reaches once a member of the composition provides it. Mirrors the
 * back-end `RaidBuffScope` enum — string-valued because the back-end's `JsonStringEnumConverter`
 * serializes enums as their name.
 */
export enum RaidBuffScope {
  Raid = 'Raid',
  Group = 'Group',
  Individual = 'Individual',
}

/** Every scope, in the order the admin screen groups and offers them. */
export const RAID_BUFF_SCOPE_ORDER: RaidBuffScope[] = [RaidBuffScope.Raid, RaidBuffScope.Group, RaidBuffScope.Individual];
