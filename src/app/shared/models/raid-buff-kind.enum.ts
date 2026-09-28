/**
 * Whether a raid buff definition helps the raid or hinders the boss. Mirrors the back-end
 * `RaidBuffKind` enum — string-valued, see `RaidBuffScope`.
 */
export enum RaidBuffKind {
  Buff = 'Buff',
  Debuff = 'Debuff',
}

/** Every kind, in the order the admin screen offers them. */
export const RAID_BUFF_KIND_ORDER: RaidBuffKind[] = [RaidBuffKind.Buff, RaidBuffKind.Debuff];
